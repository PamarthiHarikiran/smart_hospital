const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor reference is required'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'BLOCKED'],
      default: 'ACTIVE',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
    },
    lastMessageText: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    patientUnread: {
      type: Number,
      default: 0,
      min: 0,
    },
    doctorUnread: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ patient: 1, doctor: 1 }, { unique: true });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ status: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
