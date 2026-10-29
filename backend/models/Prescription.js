const mongoose = require('mongoose');

const prescriptionMedicineSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
  },
  name: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    default: '',
  },
});

const prescriptionSchema = new mongoose.Schema(
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
    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    medicines: [prescriptionMedicineSchema],
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
