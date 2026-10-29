const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation reference is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    messageType: {
      type: String,
      enum: ['TEXT', 'EMERGENCY_NOTE', 'SYSTEM'],
      default: 'TEXT',
    },
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'READ'],
      default: 'SENT',
    },
    clientTempId: {
      type: String,
      default: null,
      trim: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
chatMessageSchema.index({ conversation: 1, createdAt: 1 });
chatMessageSchema.index({ recipient: 1, status: 1 });
chatMessageSchema.index({ sender: 1 });
chatMessageSchema.index({ clientTempId: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
module.exports = ChatMessage;
