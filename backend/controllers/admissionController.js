const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Admit a patient (Assign bed & set OCCUPIED)
// @route   POST /api/admissions
// @access  Private (Admin, Doctor)
const createAdmission = async (req, res, next) => {
  try {
    const { patient, doctor, bed, admissionDate, expectedDischargeDate, reason } = req.body;

    if (!patient || !doctor || !bed || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Patient, doctor, bed, and reason are required',
      });
    }

    // Verify bed availability
    const targetBed = await Bed.findById(bed);
    if (!targetBed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    if (targetBed.status !== 'AVAILABLE') {
      return res.status(409).json({
        success: false,
        message: `Bed ${targetBed.bedNumber} is currently ${targetBed.status} and cannot be assigned.`,
      });
    }

    // Verify patient isn't already actively admitted
    const activeAdmission = await Admission.findOne({
      patient,
      status: 'ADMITTED',
    });
    if (activeAdmission) {
      return res.status(409).json({
        success: false,
        message: 'This patient is already currently admitted to the hospital.',
      });
    }

    // Create admission
    const admission = await Admission.create({
      patient,
      doctor,
      bed,
      admissionDate: admissionDate || new Date(),
      expectedDischargeDate: expectedDischargeDate || null,
      reason,
      status: 'ADMITTED',
    });

    // Mark bed as OCCUPIED
    targetBed.status = 'OCCUPIED';
    await targetBed.save();

    const populated = await Admission.findById(admission._id)
      .populate('patient', 'name email phone gender dateOfBirth bloodGroup')
      .populate('doctor', 'name specialization')
      .populate('bed', 'bedNumber ward bedType');

    // Notify patient
    await createNotification({
      userId: patient,
      title: 'Hospital Admission Notice',
      message: `You have been admitted to ${targetBed.ward} (Bed #${targetBed.bedNumber}) under Dr. ${populated.doctor.name}.`,
      type: 'ADMISSION',
    });

    res.status(201).json({
      success: true,
      message: 'Patient admitted successfully and bed marked OCCUPIED',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admissions
// @route   GET /api/admissions
// @access  Private (Admin, Doctor, Patient)
const getAdmissions = async (req, res, next) => {
  try {
    const { status, patient, doctor, page = 1, limit = 10, search } = req.query;
    const query = {};

    if (req.user.role === 'PATIENT') {
      query.patient = req.user._id;
    } else if (req.user.role === 'DOCTOR') {
      if (patient) query.patient = patient;
      else query.doctor = req.user._id;
    } else {
      if (patient) query.patient = patient;
      if (doctor) query.doctor = doctor;
    }

    if (status) query.status = status.toUpperCase();
    if (search) {
      query.reason = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Admission.countDocuments(query);
    const admissions = await Admission.find(query)
      .populate('patient', 'name email phone gender bloodGroup')
      .populate('doctor', 'name specialization')
      .populate('bed', 'bedNumber ward bedType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: admissions,
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

// @desc    Get single admission
// @route   GET /api/admissions/:id
// @access  Private
const getAdmissionById = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('patient', 'name email phone gender bloodGroup address')
      .populate('doctor', 'name specialization email phone')
      .populate('bed', 'bedNumber ward bedType status');

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found',
      });
    }

    if (
      req.user.role === 'PATIENT' &&
      admission.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    res.status(200).json({
      success: true,
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admission details
// @route   PUT /api/admissions/:id
// @access  Private (Admin, Doctor)
const updateAdmission = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found',
      });
    }

    const updated = await Admission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization')
      .populate('bed', 'bedNumber ward');

    res.status(200).json({
      success: true,
      message: 'Admission updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Discharge patient (Frees bed & sets status to AVAILABLE)
// @route   PUT /api/admissions/:id/discharge
// @access  Private (Admin, Doctor)
const dischargePatient = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id).populate('bed');

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found',
      });
    }

    if (admission.status === 'DISCHARGED') {
      return res.status(400).json({
        success: false,
        message: 'Patient has already been discharged.',
      });
    }

    admission.status = 'DISCHARGED';
    admission.dischargeDate = new Date();
    await admission.save();

    // Free the bed -> set status to AVAILABLE
    if (admission.bed) {
      await Bed.findByIdAndUpdate(admission.bed._id, { status: 'AVAILABLE' });
    }

    await createNotification({
      userId: admission.patient,
      title: 'Discharge Summary Ready',
      message: 'You have been discharged from the hospital. Please visit billing to finalize your invoice.',
      type: 'ADMISSION',
    });

    const populated = await Admission.findById(admission._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('bed', 'bedNumber ward status');

    res.status(200).json({
      success: true,
      message: 'Patient discharged successfully and bed is now AVAILABLE',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdmission,
  getAdmissions,
  getAdmissionById,
  updateAdmission,
  dischargePatient,
};
