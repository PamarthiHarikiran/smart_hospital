const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    minimumStock: {
      type: Number,
      required: [true, 'Minimum stock threshold is required'],
      min: [0, 'Minimum stock cannot be negative'],
      default: 10,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

medicineSchema.index({ name: 'text', category: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;
