const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private (Doctor, Admin)
const createMedicalRecord = async (req, res, next) => {
  try {
    const { patient, appointment, symptoms, diagnosis, notes, treatment, followUpDate } = req.body;
    const doctor = req.user._id;

    if (!patient || !symptoms || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Patient, symptoms, and diagnosis are required',
      });
    }

    const record = await MedicalRecord.create({
      patient,
      doctor,
      appointment: appointment || null,
      symptoms,
      diagnosis,
      notes: notes || '',
      treatment: treatment || '',
      followUpDate: followUpDate || null,
    });

    // If an appointment was linked, mark the appointment as COMPLETED
    if (appointment) {
      await Appointment.findByIdAndUpdate(appointment, { status: 'COMPLETED' });
    }

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate('patient', 'name email phone gender dateOfBirth bloodGroup')
      .populate('doctor', 'name specialization')
      .populate('appointment');

    await createNotification({
      userId: patient,
      title: 'New Medical Record Added',
      message: `Dr. ${req.user.name} added a medical record regarding your visit (Diagnosis: ${diagnosis}).`,
      type: 'SYSTEM',
      link: '/patient/medical-records',
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: populatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all medical records
// @route   GET /api/medical-records
// @access  Private (Doctor, Patient, Admin)
const getMedicalRecords = async (req, res, next) => {
  try {
    const { patient, doctor, page = 1, limit = 10, search } = req.query;
    const query = {};

    if (req.user.role === 'PATIENT') {
      query.patient = req.user._id;
    } else if (req.user.role === 'DOCTOR') {
      if (patient) {
        query.patient = patient;
      } else {
        query.doctor = req.user._id;
      }
    } else {
      // ADMIN
      if (patient) query.patient = patient;
      if (doctor) query.doctor = doctor;
    }

    if (search) {
      query.$or = [
        { diagnosis: { $regex: search, $options: 'i' } },
        { symptoms: { $regex: search, $options: 'i' } },
        { treatment: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await MedicalRecord.countDocuments(query);
    const records = await MedicalRecord.find(query)
      .populate('patient', 'name email phone gender dateOfBirth bloodGroup')
      .populate('doctor', 'name specialization')
      .populate('appointment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
const getMedicalRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name email phone gender dateOfBirth bloodGroup address')
      .populate('doctor', 'name specialization email phone')
      .populate('appointment');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found',
      });
    }

    // Authorization check
    if (
      req.user.role === 'PATIENT' &&
      record.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view another patient’s medical records',
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private (Doctor who created it, or Admin)
const updateMedicalRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found',
      });
    }

    if (
      req.user.role !== 'ADMIN' &&
      record.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the attending doctor or admin can modify this record',
      });
    }

    const updated = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization');

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
};
