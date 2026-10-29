const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    date: {
      type: String,
      required: [true, 'Appointment date is required (YYYY-MM-DD)'],
    },
    time: {
      type: String,
      required: [true, 'Appointment time is required (e.g. 09:00 AM)'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for appointment is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help query doctor schedule quickly
appointmentSchema.index({ doctor: 1, date: 1, time: 1 });
appointmentSchema.index({ patient: 1, date: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
