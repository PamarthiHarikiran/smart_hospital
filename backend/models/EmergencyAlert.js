const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    description: {
      type: String,
      trim: true,
      default: 'Emergency assistance requested by patient',
    },
    symptoms: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM'],
      default: 'CRITICAL',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'PENDING',
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgementNote: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNote: {
      type: String,
      default: '',
      trim: true,
    },
    auditTrail: [
      {
        status: {
          type: String,
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
emergencyAlertSchema.index({ status: 1, createdAt: -1 });
emergencyAlertSchema.index({ patient: 1, createdAt: -1 });
emergencyAlertSchema.index({ doctor: 1, status: 1 });
emergencyAlertSchema.index({ priority: 1, status: 1 });

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);
module.exports = EmergencyAlert;
