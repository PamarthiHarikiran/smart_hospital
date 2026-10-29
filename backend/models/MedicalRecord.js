const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    symptoms: {
      type: String,
      required: [true, 'Symptoms are required'],
      trim: true,
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    treatment: {
      type: String,
      default: '',
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ patient: 1, createdAt: -1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
module.exports = MedicalRecord;
