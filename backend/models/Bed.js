const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: [true, 'Bed number is required'],
      unique: true,
      trim: true,
    },
    ward: {
      type: String,
      required: [true, 'Ward name is required'],
      trim: true,
    },
    bedType: {
      type: String,
      enum: ['GENERAL', 'ICU', 'EMERGENCY', 'PRIVATE', 'PEDIATRIC'],
      default: 'GENERAL',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
  },
  {
    timestamps: true,
  }
);

bedSchema.index({ status: 1, ward: 1 });

const Bed = mongoose.model('Bed', bedSchema);
module.exports = Bed;
