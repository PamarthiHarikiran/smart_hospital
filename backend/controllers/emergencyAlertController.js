const EmergencyAlert = require('../models/EmergencyAlert');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

let ioInstance = null;
const setEmergencySocketIO = (io) => {
  ioInstance = io;
};

const MEDICAL_DISCLAIMER =
  'For life-threatening emergencies, do not wait for a chat response. Contact local emergency services or seek immediate medical attention.';

// @desc    Trigger emergency alert
// @route   POST /api/emergency-alerts
// @access  Private (PATIENT)
const createAlert = async (req, res, next) => {
  try {
    const patientId = req.user._id;
    const { doctorId, conversationId, description, symptoms, priority = 'CRITICAL' } = req.body;

    let doctor = null;
    if (doctorId) {
      doctor = await User.findOne({ _id: doctorId, role: 'DOCTOR' });
    }

    const alert = await EmergencyAlert.create({
      patient: patientId,
      doctor: doctor ? doctor._id : null,
      conversation: conversationId || null,
      description: description || 'Patient triggered red emergency assistance alert.',
      symptoms: symptoms || '',
      priority,
      status: 'PENDING',
      auditTrail: [
        {
          status: 'PENDING',
          changedBy: patientId,
          changedAt: new Date(),
          note: 'Emergency alert initiated by patient',
        },
      ],
    });

    const populatedAlert = await EmergencyAlert.findById(alert._id)
      .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
      .populate('doctor', 'name email specialization department phone')
      .lean();

    // Notify Duty Staff & Admins
    const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('_id');
    const notificationPromises = admins.map((admin) =>
      createNotification({
        userId: admin._id,
        title: `🚨 EMERGENCY ALERT: ${req.user.name}`,
        message: `Patient ${req.user.name} triggered a priority emergency alert: "${description || 'Immediate assistance requested'}".`,
        type: 'EMERGENCY',
        link: '/admin/emergency-alerts',
      })
    );

    if (doctor) {
      notificationPromises.push(
        createNotification({
          userId: doctor._id,
          title: `🚨 EMERGENCY ALERT: ${req.user.name}`,
          message: `Your patient ${req.user.name} reported a medical emergency: "${description || 'Assistance requested'}".`,
          type: 'EMERGENCY',
          link: '/doctor/messages',
        })
      );
    }

    await Promise.allSettled(notificationPromises);

    // Emit real-time Socket event
    if (ioInstance) {
      // Broadcast to global duty team room and admin channel
      ioInstance.to('duty_team').emit('emergency_alert_received', populatedAlert);
      ioInstance.to('admin_room').emit('emergency_alert_received', populatedAlert);

      // Send to assigned doctor room
      if (doctor) {
        ioInstance.to(`user:${doctor._id}`).emit('emergency_alert_received', populatedAlert);
      }

      // Confirm back to patient personal room
      ioInstance.to(`user:${patientId}`).emit('emergency_alert_confirmed', populatedAlert);
    }

    res.status(201).json({
      success: true,
      message: 'Emergency alert registered and transmitted to clinical duty team.',
      disclaimer: MEDICAL_DISCLAIMER,
      data: populatedAlert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get emergency alerts (filtered by role and query)
// @route   GET /api/emergency-alerts
// @access  Private (PATIENT, DOCTOR, ADMIN)
const getAlerts = async (req, res, next) => {
  try {
    const { status, priority, limit = 50, page = 1 } = req.query;
    const query = {};

    // Role-based visibility
    if (req.user.role === 'PATIENT') {
      query.patient = req.user._id;
    } else if (req.user.role === 'DOCTOR') {
      // Doctors see alerts specifically assigned to them OR unassigned pending alerts
      query.$or = [{ doctor: req.user._id }, { status: 'PENDING' }];
    } // Admins see all hospital alerts

    // Status filter
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [alerts, total, pendingCount] = await Promise.all([
      EmergencyAlert.find(query)
        .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
        .populate('doctor', 'name email specialization department phone')
        .populate('acknowledgedBy', 'name role')
        .populate('resolvedBy', 'name role')
        .sort({ status: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      EmergencyAlert.countDocuments(query),
      EmergencyAlert.countDocuments({ status: 'PENDING' }),
    ]);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      pendingCount,
      disclaimer: MEDICAL_DISCLAIMER,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single emergency alert
// @route   GET /api/emergency-alerts/:id
// @access  Private
const getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await EmergencyAlert.findById(id)
      .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
      .populate('doctor', 'name email specialization department phone')
      .populate('acknowledgedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .populate('auditTrail.changedBy', 'name role');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Emergency alert not found' });
    }

    if (
      req.user.role === 'PATIENT' &&
      alert.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only view your own emergency alerts',
      });
    }

    res.status(200).json({
      success: true,
      disclaimer: MEDICAL_DISCLAIMER,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge emergency alert
// @route   PATCH /api/emergency-alerts/:id/acknowledge
// @access  Private (DOCTOR, ADMIN)
const acknowledgeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const alert = await EmergencyAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Emergency alert not found' });
    }

    if (alert.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Alert is already marked as ${alert.status}`,
      });
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();
    alert.acknowledgementNote = note || `Acknowledged by ${req.user.name} (${req.user.role})`;
    alert.auditTrail.push({
      status: 'ACKNOWLEDGED',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || 'Acknowledged clinical alert response',
    });

    await alert.save();

    const populatedAlert = await EmergencyAlert.findById(alert._id)
      .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
      .populate('doctor', 'name email specialization department phone')
      .populate('acknowledgedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .lean();

    // Notify Patient
    await createNotification({
      userId: alert.patient,
      title: 'Emergency Alert Acknowledged',
      message: `Your emergency alert has been officially acknowledged by ${req.user.name} (${req.user.role}). Assistance is being coordinated.`,
      type: 'EMERGENCY',
      link: '/patient/chat',
    });

    // Broadcast update via socket
    if (ioInstance) {
      ioInstance.emit('emergency_alert_updated', populatedAlert);
    }

    res.status(200).json({
      success: true,
      message: 'Alert successfully acknowledged.',
      data: populatedAlert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve emergency alert
// @route   PATCH /api/emergency-alerts/:id/resolve
// @access  Private (DOCTOR, ADMIN)
const resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const alert = await EmergencyAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Emergency alert not found' });
    }

    if (alert.status === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved',
      });
    }

    alert.status = 'RESOLVED';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    alert.resolutionNote = note || `Resolved by ${req.user.name} (${req.user.role})`;
    alert.auditTrail.push({
      status: 'RESOLVED',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || 'Emergency condition resolved and documented',
    });

    await alert.save();

    const populatedAlert = await EmergencyAlert.findById(alert._id)
      .populate('patient', 'name email phone bloodGroup gender address dateOfBirth')
      .populate('doctor', 'name email specialization department phone')
      .populate('acknowledgedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .lean();

    // Notify Patient
    await createNotification({
      userId: alert.patient,
      title: 'Emergency Case Resolved',
      message: `Your emergency alert case has been officially marked as resolved by ${req.user.name}.`,
      type: 'EMERGENCY',
      link: '/patient/chat',
    });

    // Broadcast update via socket
    if (ioInstance) {
      ioInstance.emit('emergency_alert_updated', populatedAlert);
    }

    res.status(200).json({
      success: true,
      message: 'Emergency alert successfully resolved and documented.',
      data: populatedAlert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get count of active (PENDING + ACKNOWLEDGED) alerts
// @route   GET /api/emergency-alerts/active-count
// @access  Private
const getActiveCount = async (req, res, next) => {
  try {
    const [pending, acknowledged] = await Promise.all([
      EmergencyAlert.countDocuments({ status: 'PENDING' }),
      EmergencyAlert.countDocuments({ status: 'ACKNOWLEDGED' }),
    ]);

    res.status(200).json({
      success: true,
      pending,
      acknowledged,
      totalActive: pending + acknowledged,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setEmergencySocketIO,
  createAlert,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getActiveCount,
  MEDICAL_DISCLAIMER,
};
