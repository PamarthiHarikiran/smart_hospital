const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const EmergencyAlert = require('../models/EmergencyAlert');
const { createNotification } = require('../utils/notificationHelper');
const { setChatSocketIO } = require('../controllers/chatController');
const { setEmergencySocketIO } = require('../controllers/emergencyAlertController');
const { setLabReportSocketIO } = require('../controllers/labReportController');

let io = null;

// Map of userId -> { socketCount: number, user: Object, lastSeen: Date }
const onlineUsers = new Map();

/**
 * Initialize Socket.IO with HTTP Server
 */
const initSocketServer = (httpServer) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive during dev
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Pass io instance to REST controllers
  setChatSocketIO(io);
  setEmergencySocketIO(io);
  setLabReportSocketIO(io);

  // Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: No authorization token provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_jwt_secret_hospital_management_2026'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User account does not exist'));
      }

      if (user.status !== 'ACTIVE') {
        return next(new Error('Authentication error: Account is deactivated'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    const user = socket.user;
    const userIdStr = user._id.toString();

    // Track online user
    if (!onlineUsers.has(userIdStr)) {
      onlineUsers.set(userIdStr, {
        socketCount: 1,
        user: {
          _id: user._id,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
        },
        lastSeen: new Date(),
      });
      // Broadcast online status
      socket.broadcast.emit('user_online', {
        userId: userIdStr,
        user: onlineUsers.get(userIdStr).user,
      });
    } else {
      const entry = onlineUsers.get(userIdStr);
      entry.socketCount += 1;
      entry.lastSeen = new Date();
    }

    // Join personal room for targeted alerts & notifications
    socket.join(`user:${userIdStr}`);

    // Join role-specific rooms
    if (user.role === 'ADMIN') {
      socket.join('admin_room');
      socket.join('duty_team');
      socket.join('lab_staff');
    } else if (user.role === 'DOCTOR') {
      socket.join('duty_team');
    } else if (user.role === 'LAB') {
      socket.join('lab_staff');
    }

    // Send initial list of currently online user IDs
    socket.emit('online_users_list', Array.from(onlineUsers.keys()));

    // ----------------------------------------------------
    // Event: Join Conversation Room (Secure Server Validation)
    // ----------------------------------------------------
    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) {
          if (callback) callback({ success: false, message: 'Conversation ID required' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userIdStr
        );

        if (!isParticipant && user.role !== 'ADMIN') {
          if (callback) callback({ success: false, message: 'Forbidden: unauthorized room join' });
          return;
        }

        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);

        if (callback) {
          callback({
            success: true,
            conversationId,
            room: roomName,
          });
        }
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ----------------------------------------------------
    // Event: Leave Conversation Room
    // ----------------------------------------------------
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // ----------------------------------------------------
    // Event: Send Message Real-Time
    // ----------------------------------------------------
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, content, clientTempId, messageType = 'TEXT' } = data;

        if (!conversationId || !content || !content.trim()) {
          if (callback) callback({ success: false, message: 'Invalid conversation or empty message' });
          return;
        }

        if (content.length > 2000) {
          if (callback) callback({ success: false, message: 'Message exceeds 2000 characters' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userIdStr
        );
        if (!isParticipant) {
          if (callback) callback({ success: false, message: 'Unauthorized: not a participant' });
          return;
        }

        // Deduplication check
        if (clientTempId) {
          const existing = await ChatMessage.findOne({
            conversation: conversationId,
            clientTempId,
          })
            .populate('sender', 'name role profileImage')
            .populate('recipient', 'name role profileImage');

          if (existing) {
            if (callback) callback({ success: true, message: existing, deduplicated: true });
            return;
          }
        }

        // Determine recipient
        const recipientId = conversation.participants.find(
          (p) => p.toString() !== userIdStr
        );

        const isRecipientOnline = onlineUsers.has(recipientId.toString());

        const chatMessage = await ChatMessage.create({
          conversation: conversationId,
          sender: user._id,
          recipient: recipientId,
          content: content.trim(),
          messageType,
          status: isRecipientOnline ? 'DELIVERED' : 'SENT',
          deliveredAt: isRecipientOnline ? new Date() : null,
          clientTempId: clientTempId || null,
        });

        // Update conversation metadata
        const updateData = {
          lastMessage: chatMessage._id,
          lastMessageText: content.trim(),
          lastMessageSender: user._id,
          lastMessageAt: new Date(),
        };

        if (user.role === 'PATIENT') {
          updateData.$inc = { doctorUnread: 1 };
        } else {
          updateData.$inc = { patientUnread: 1 };
        }

        await Conversation.findByIdAndUpdate(conversationId, updateData);

        const populatedMessage = await ChatMessage.findById(chatMessage._id)
          .populate('sender', 'name role profileImage')
          .populate('recipient', 'name role profileImage')
          .lean();

        // Broadcast to conversation room (including sender)
        io.to(`conversation:${conversationId}`).emit('new_message', populatedMessage);

        // Also emit notification directly to recipient's personal room
        io.to(`user:${recipientId}`).emit('unread_notification', {
          type: 'CHAT',
          conversationId,
          senderName: user.name,
          message: populatedMessage,
        });

        // Dispatch in-app notification record
        await createNotification({
          userId: recipientId,
          title: `New message from ${user.name}`,
          message: content.length > 80 ? `${content.substring(0, 80)}...` : content,
          type: 'CHAT',
          link: user.role === 'PATIENT' ? '/doctor/messages' : '/patient/chat',
        });

        if (callback) {
          callback({ success: true, message: populatedMessage });
        }
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ----------------------------------------------------
    // Event: Mark Messages as Read
    // ----------------------------------------------------
    socket.on('message_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const now = new Date();
        await ChatMessage.updateMany(
          {
            conversation: conversationId,
            recipient: user._id,
            status: { $ne: 'READ' },
          },
          {
            $set: {
              status: 'READ',
              readAt: now,
            },
          }
        );

        const resetField = user.role === 'PATIENT' ? { patientUnread: 0 } : { doctorUnread: 0 };
        await Conversation.findByIdAndUpdate(conversationId, { $set: resetField });

        io.to(`conversation:${conversationId}`).emit('message_status_update', {
          conversationId,
          readerId: userIdStr,
          status: 'READ',
          readAt: now,
        });
      } catch (err) {
        console.error('Error marking messages as read:', err.message);
      }
    });

    // ----------------------------------------------------
    // Event: Typing Indicators
    // ----------------------------------------------------
    socket.on('typing_start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId: userIdStr,
          userName: user.name,
        });
      }
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          conversationId,
          userId: userIdStr,
        });
      }
    });

    // ----------------------------------------------------
    // Event: Trigger Emergency Alert
    // ----------------------------------------------------
    socket.on('trigger_emergency_alert', async (data, callback) => {
      try {
        if (user.role !== 'PATIENT' && user.role !== 'ADMIN') {
          if (callback) callback({ success: false, message: 'Only patients or administrators can trigger emergency alerts' });
          return;
        }

        const { doctorId, conversationId, description, symptoms, priority = 'CRITICAL' } = data;

        let doctor = null;
        if (doctorId) {
          doctor = await User.findOne({ _id: doctorId, role: 'DOCTOR' });
        }

        const alert = await EmergencyAlert.create({
          patient: user._id,
          doctor: doctor ? doctor._id : null,
          conversation: conversationId || null,
          description: description || 'Emergency alert triggered by patient via real-time interface',
          symptoms: symptoms || '',
          priority,
          status: 'PENDING',
          auditTrail: [
            {
              status: 'PENDING',
              changedBy: user._id,
              changedAt: new Date(),
              note: 'Emergency alert initiated by patient via Socket.IO',
            },
          ],
        });

        const populatedAlert = await EmergencyAlert.findById(alert._id)
          .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
          .populate('doctor', 'name email specialization department phone')
          .lean();

        // Broadcast to Duty Team & Admins
        io.to('duty_team').emit('emergency_alert_received', populatedAlert);
        io.to('admin_room').emit('emergency_alert_received', populatedAlert);

        if (doctor) {
          io.to(`user:${doctor._id}`).emit('emergency_alert_received', populatedAlert);
        }

        socket.emit('emergency_alert_confirmed', populatedAlert);

        // High priority notifications
        const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('_id');
        admins.forEach((admin) => {
          createNotification({
            userId: admin._id,
            title: `🚨 EMERGENCY ALERT: ${user.name}`,
            message: `Priority emergency alert triggered: "${description || 'Immediate assistance requested'}".`,
            type: 'EMERGENCY',
            link: '/admin/emergency-alerts',
          });
        });

        if (doctor) {
          createNotification({
            userId: doctor._id,
            title: `🚨 EMERGENCY ALERT: ${user.name}`,
            message: `Patient ${user.name} reported a medical emergency: "${description || 'Immediate assistance requested'}".`,
            type: 'EMERGENCY',
            link: '/doctor/messages',
          });
        }

        if (callback) {
          callback({
            success: true,
            alert: populatedAlert,
            disclaimer:
              'For life-threatening emergencies, do not wait for a chat response. Contact local emergency services or seek immediate medical attention.',
          });
        }
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ----------------------------------------------------
    // Event: Acknowledge Emergency Alert
    // ----------------------------------------------------
    socket.on('acknowledge_emergency_alert', async ({ alertId, note }, callback) => {
      try {
        if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
          if (callback) callback({ success: false, message: 'Unauthorized: Staff credentials required' });
          return;
        }

        const alert = await EmergencyAlert.findById(alertId);
        if (!alert) {
          if (callback) callback({ success: false, message: 'Emergency alert not found' });
          return;
        }

        if (alert.status !== 'PENDING') {
          if (callback) callback({ success: false, message: `Alert is already ${alert.status}` });
          return;
        }

        alert.status = 'ACKNOWLEDGED';
        alert.acknowledgedBy = user._id;
        alert.acknowledgedAt = new Date();
        alert.acknowledgementNote = note || `Acknowledged by ${user.name} (${user.role})`;
        alert.auditTrail.push({
          status: 'ACKNOWLEDGED',
          changedBy: user._id,
          changedAt: new Date(),
          note: note || 'Acknowledged emergency response',
        });

        await alert.save();

        const populatedAlert = await EmergencyAlert.findById(alert._id)
          .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
          .populate('doctor', 'name email specialization department phone')
          .populate('acknowledgedBy', 'name role')
          .populate('resolvedBy', 'name role')
          .lean();

        // Broadcast to all connected clients
        io.emit('emergency_alert_updated', populatedAlert);

        // Notify patient
        await createNotification({
          userId: alert.patient,
          title: 'Emergency Alert Acknowledged',
          message: `Your emergency alert has been acknowledged by ${user.name} (${user.role}). Clinical assistance is in progress.`,
          type: 'EMERGENCY',
          link: '/patient/chat',
        });

        if (callback) callback({ success: true, alert: populatedAlert });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ----------------------------------------------------
    // Event: Resolve Emergency Alert
    // ----------------------------------------------------
    socket.on('resolve_emergency_alert', async ({ alertId, note }, callback) => {
      try {
        if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
          if (callback) callback({ success: false, message: 'Unauthorized: Staff credentials required' });
          return;
        }

        const alert = await EmergencyAlert.findById(alertId);
        if (!alert) {
          if (callback) callback({ success: false, message: 'Emergency alert not found' });
          return;
        }

        alert.status = 'RESOLVED';
        alert.resolvedBy = user._id;
        alert.resolvedAt = new Date();
        alert.resolutionNote = note || `Resolved by ${user.name} (${user.role})`;
        alert.auditTrail.push({
          status: 'RESOLVED',
          changedBy: user._id,
          changedAt: new Date(),
          note: note || 'Emergency case resolved and verified',
        });

        await alert.save();

        const populatedAlert = await EmergencyAlert.findById(alert._id)
          .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
          .populate('doctor', 'name email specialization department phone')
          .populate('acknowledgedBy', 'name role')
          .populate('resolvedBy', 'name role')
          .lean();

        io.emit('emergency_alert_updated', populatedAlert);

        await createNotification({
          userId: alert.patient,
          title: 'Emergency Case Resolved',
          message: `Your emergency case has been officially marked as resolved by ${user.name}.`,
          type: 'EMERGENCY',
          link: '/patient/chat',
        });

        if (callback) callback({ success: true, alert: populatedAlert });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ----------------------------------------------------
    // Event: Join Lab Report Room for Live Specimen Telemetry
    // ----------------------------------------------------
    socket.on('join_lab_report', ({ reportId }, callback) => {
      try {
        if (!reportId) {
          if (callback) callback({ success: false, message: 'Report ID required' });
          return;
        }
        const roomName = `lab_report:${reportId}`;
        socket.join(roomName);
        if (callback) {
          callback({ success: true, reportId, room: roomName });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('leave_lab_report', ({ reportId }) => {
      if (reportId) {
        socket.leave(`lab_report:${reportId}`);
      }
    });

    // ----------------------------------------------------
    // Disconnect Event
    // ----------------------------------------------------
    socket.on('disconnect', () => {
      if (onlineUsers.has(userIdStr)) {
        const entry = onlineUsers.get(userIdStr);
        entry.socketCount -= 1;
        entry.lastSeen = new Date();

        if (entry.socketCount <= 0) {
          onlineUsers.delete(userIdStr);
          socket.broadcast.emit('user_offline', {
            userId: userIdStr,
            lastSeen: entry.lastSeen,
          });
        }
      }
    });
  });

  return io;
};

const getIO = () => io;

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

module.exports = {
  initSocketServer,
  getIO,
  getOnlineUserIds,
};
