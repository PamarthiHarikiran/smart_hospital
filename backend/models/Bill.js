const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['CONSULTATION', 'LAB', 'MEDICINE', 'ADMISSION', 'OTHER'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
});

const billSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    items: [billItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'ONLINE', 'INSURANCE', 'DEMO_PAY'],
      default: 'CASH',
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

billSchema.index({ patient: 1, paymentStatus: 1 });

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;
