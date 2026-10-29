const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { createNotification } = require('../utils/notificationHelper');

// Helper to get socket.io instance
let ioInstance = null;
const setChatSocketIO = (io) => {
  ioInstance = io;
};

// @desc    Get all conversations for logged in user
// @route   GET /api/chat/conversations
// @access  Private (PATIENT, DOCTOR, ADMIN)
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let query = { participants: userId };

    if (req.user.role === 'ADMIN' && req.query.all === 'true') {
      query = {}; // Admin can inspect all if explicitly requested
    }

    const conversations = await Conversation.find(query)
      .populate('patient', 'name email role phone profileImage bloodGroup gender')
      .populate('doctor', 'name email role phone profileImage specialization department')
      .populate('lastMessage')
      .populate('lastMessageSender', 'name role')
      .sort({ lastMessageAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create conversation between patient and doctor
// @route   POST /api/chat/conversations
// @access  Private (PATIENT, DOCTOR)
const getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    let patientId, doctorId;

    if (userRole === 'PATIENT') {
      patientId = userId;
      doctorId = req.body.doctorId;
      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message: 'Please provide doctorId to start a conversation',
        });
      }
    } else if (userRole === 'DOCTOR') {
      doctorId = userId;
      patientId = req.body.patientId;
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Please provide patientId to start a conversation',
        });
      }
    } else if (userRole === 'ADMIN') {
      patientId = req.body.patientId;
      doctorId = req.body.doctorId;
      if (!patientId || !doctorId) {
        return res.status(400).json({
          success: false,
          message: 'Admin must provide both patientId and doctorId',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Your role is not authorized for direct doctor-patient messaging',
      });
    }

    // Verify both participants exist
    const [patient, doctor] = await Promise.all([
      User.findOne({ _id: patientId, role: 'PATIENT' }),
      User.findOne({ _id: doctorId, role: 'DOCTOR' }),
    ]);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      patient: patientId,
      doctor: doctorId,
    })
      .populate('patient', 'name email role phone profileImage bloodGroup gender')
      .populate('doctor', 'name email role phone profileImage specialization department')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [patientId, doctorId],
        patient: patientId,
        doctor: doctorId,
        status: 'ACTIVE',
        lastMessageText: 'Conversation started',
        lastMessageAt: new Date(),
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('patient', 'name email role phone profileImage bloodGroup gender')
        .populate('doctor', 'name email role phone profileImage specialization department');
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single conversation details
// @route   GET /api/chat/conversations/:id
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id)
      .populate('patient', 'name email role phone profileImage bloodGroup gender')
      .populate('doctor', 'name email role phone profileImage specialization department')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this conversation',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get message history for conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access messages in this conversation',
      });
    }

    const totalMessages = await ChatMessage.countDocuments({ conversation: id });

    const messages = await ChatMessage.find({ conversation: id })
      .populate('sender', 'name role profileImage')
      .populate('recipient', 'name role profileImage')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: messages.length,
      total: totalMessages,
      page,
      pages: Math.ceil(totalMessages / limit),
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message (REST API endpoint & fallback)
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, clientTempId, messageType = 'TEXT' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty',
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum length of 2000 characters',
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const userIdStr = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userIdStr
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to post in this conversation',
      });
    }

    // Deduplication check using clientTempId
    if (clientTempId) {
      const existing = await ChatMessage.findOne({
        conversation: id,
        clientTempId,
      })
        .populate('sender', 'name role profileImage')
        .populate('recipient', 'name role profileImage');
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Message already received (deduplicated)',
          data: existing,
        });
      }
    }

    // Determine recipient
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== userIdStr
    );

    const message = await ChatMessage.create({
      conversation: id,
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim(),
      messageType,
      status: 'SENT',
      clientTempId: clientTempId || null,
    });

    // Update conversation metadata
    const updateData = {
      lastMessage: message._id,
      lastMessageText: content.trim(),
      lastMessageSender: req.user._id,
      lastMessageAt: new Date(),
    };

    if (req.user.role === 'PATIENT') {
      updateData.$inc = { doctorUnread: 1 };
    } else {
      updateData.$inc = { patientUnread: 1 };
    }

    await Conversation.findByIdAndUpdate(id, updateData);

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'name role profileImage')
      .populate('recipient', 'name role profileImage')
      .lean();

    // Trigger Notification for recipient
    await createNotification({
      userId: recipientId,
      title: `New message from ${req.user.name}`,
      message: content.length > 80 ? `${content.substring(0, 80)}...` : content,
      type: 'CHAT',
      link: req.user.role === 'PATIENT' ? '/doctor/messages' : '/patient/chat',
    });

    // Emit real-time Socket event if ioInstance is active
    if (ioInstance) {
      ioInstance.to(`conversation:${id}`).emit('new_message', populatedMessage);
      ioInstance.to(`user:${recipientId}`).emit('unread_notification', {
        type: 'CHAT',
        conversationId: id,
        senderName: req.user.name,
        message: populatedMessage,
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation messages as read
// @route   PATCH /api/chat/conversations/:id/read
// @access  Private
const markConversationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const now = new Date();
    await ChatMessage.updateMany(
      {
        conversation: id,
        recipient: userId,
        status: { $ne: 'READ' },
      },
      {
        $set: {
          status: 'READ',
          readAt: now,
        },
      }
    );

    // Reset unread count on conversation
    const resetField = req.user.role === 'PATIENT' ? { patientUnread: 0 } : { doctorUnread: 0 };
    await Conversation.findByIdAndUpdate(id, { $set: resetField });

    // Emit real-time read event
    if (ioInstance) {
      ioInstance.to(`conversation:${id}`).emit('message_status_update', {
        conversationId: id,
        readerId: userId,
        status: 'READ',
        readAt: now,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total unread message count for user
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const unreadCount = await ChatMessage.countDocuments({
      recipient: userId,
      status: { $ne: 'READ' },
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authorized doctors for patient chat list
// @route   GET /api/chat/doctors
// @access  Private (PATIENT, ADMIN)
const getAuthorizedDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({
      role: 'DOCTOR',
      status: 'ACTIVE',
    })
      .select('name email role phone specialization department qualification experience consultationFee availability')
      .populate('department', 'name')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authorized patients for doctor chat list
// @route   GET /api/chat/patients
// @access  Private (DOCTOR, ADMIN)
const getAuthorizedPatients = async (req, res, next) => {
  try {
    const doctorId = req.user._id;

    // Retrieve patients from existing appointments or existing conversations
    const [appointmentPatients, existingConversations] = await Promise.all([
      Appointment.find({ doctor: doctorId }).distinct('patient'),
      Conversation.find({ doctor: doctorId }).distinct('patient'),
    ]);

    const patientIds = Array.from(
      new Set([
        ...appointmentPatients.map((id) => id.toString()),
        ...existingConversations.map((id) => id.toString()),
      ])
    );

    let query = { role: 'PATIENT', status: 'ACTIVE' };
    if (patientIds.length > 0 && req.user.role === 'DOCTOR') {
      // Return patients with prior appointments/conversations, or all if none yet
      query._id = { $in: patientIds };
    }

    let patients = await User.find(query)
      .select('name email role phone bloodGroup gender dateOfBirth address')
      .sort({ name: 1 })
      .lean();

    // If doctor has no specific prior appointments, allow communication with hospital patients
    if (patients.length === 0) {
      patients = await User.find({ role: 'PATIENT', status: 'ACTIVE' })
        .select('name email role phone bloodGroup gender dateOfBirth address')
        .limit(20)
        .sort({ name: 1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setChatSocketIO,
  getConversations,
  getOrCreateConversation,
  getConversationById,
  getMessages,
  sendMessage,
  markConversationAsRead,
  getUnreadCount,
  getAuthorizedDoctors,
  getAuthorizedPatients,
};
