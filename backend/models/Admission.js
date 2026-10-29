const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required'],
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: [true, 'Bed is required'],
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    expectedDischargeDate: {
      type: Date,
    },
    dischargeDate: {
      type: Date,
    },
    reason: {
      type: String,
      required: [true, 'Reason for admission is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['ADMITTED', 'DISCHARGED'],
      default: 'ADMITTED',
    },
  },
  {
    timestamps: true,
  }
);

admissionSchema.index({ patient: 1, status: 1 });
admissionSchema.index({ bed: 1, status: 1 });

const Admission = mongoose.model('Admission', admissionSchema);
module.exports = Admission;
