const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor, Admin)
const createPrescription = async (req, res, next) => {
  try {
    const { patient, medicalRecord, medicines, instructions } = req.body;
    const doctor = req.user._id;

    if (!patient || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient and at least one medicine item are required',
      });
    }

    const prescription = await Prescription.create({
      patient,
      doctor,
      medicalRecord: medicalRecord || null,
      medicines,
      instructions: instructions || '',
      status: 'ACTIVE',
    });

    const populated = await Prescription.findById(prescription._id)
      .populate('patient', 'name email phone gender')
      .populate('doctor', 'name specialization')
      .populate('medicalRecord');

    await createNotification({
      userId: patient,
      title: 'New Prescription Issued',
      message: `Dr. ${req.user.name} has issued a prescription with ${medicines.length} medicine(s).`,
      type: 'PRESCRIPTION',
      link: '/patient/prescriptions',
    });

    res.status(201).json({
      success: true,
      message: 'Prescription issued successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private (Doctor, Patient, Pharmacy, Admin)
const getPrescriptions = async (req, res, next) => {
  try {
    const { status, patient, doctor, page = 1, limit = 10, search } = req.query;
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
      // PHARMACY or ADMIN can see all, with optional patient/doctor filters
      if (patient) query.patient = patient;
      if (doctor) query.doctor = doctor;
    }

    if (status) query.status = status.toUpperCase();

    if (search) {
      query.$or = [
        { 'medicines.name': { $regex: search, $options: 'i' } },
        { instructions: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Prescription.countDocuments(query);
    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone gender bloodGroup')
      .populate('doctor', 'name specialization')
      .populate('medicalRecord')
      .populate('medicines.medicine')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: prescriptions,
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

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone gender bloodGroup address')
      .populate('doctor', 'name specialization email phone')
      .populate('medicalRecord')
      .populate('medicines.medicine');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (
      req.user.role === 'PATIENT' &&
      prescription.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view this prescription',
      });
    }

    res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update prescription status or details (Doctor or Pharmacy)
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor, Pharmacy, Admin)
const updatePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    const { status, instructions, medicines, dispense } = req.body;

    if (status) {
      prescription.status = status;
    }

    if (dispense && status === 'COMPLETED') {
      // Pharmacy dispensing: optionally deduct medicine inventory if matched by ID or name
      for (const item of prescription.medicines) {
        if (item.medicine) {
          const med = await Medicine.findById(item.medicine);
          if (med && med.stock > 0) {
            med.stock = Math.max(0, med.stock - 1);
            await med.save();
          }
        }
      }
    }

    if (req.user.role === 'DOCTOR' || req.user.role === 'ADMIN') {
      if (instructions !== undefined) prescription.instructions = instructions;
      if (medicines && Array.isArray(medicines)) prescription.medicines = medicines;
    }

    const updated = await prescription.save();
    const populated = await Prescription.findById(updated._id)
      .populate('patient', 'name email')
      .populate('doctor', 'name');

    if (status === 'COMPLETED') {
      await createNotification({
        userId: prescription.patient,
        title: 'Prescription Dispensed',
        message: 'Your prescribed medicines have been prepared and dispensed by the Pharmacy.',
        type: 'PHARMACY',
        link: '/patient/prescriptions',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
};
