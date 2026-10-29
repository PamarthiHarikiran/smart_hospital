const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Department = require('../models/Department');
const generateToken = require('../utils/generateToken');
const { createNotification } = require('../utils/notificationHelper');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

// @desc    Register a new physician
// @route   POST /api/doctors/register
// @access  Public
const registerDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      qualification,
      experience = 0,
      consultationFee = 50,
      phone = '',
      department,
      address = 'EliteCare Clinical Wing',
    } = req.body;

    if (!name || !email || !password || !specialization || !qualification) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, password, specialization, and qualification',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid @gmail.com email address',
      });
    }

    if (phone && phone.trim() !== '' && !PHONE_REGEX.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please fill a valid mobile/contact number',
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if doctor or user already exists
    const existingDoctor = await Doctor.findOne({ email: emailLower });
    const existingUser = await User.findOne({ email: emailLower });

    if (existingDoctor || existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A physician or user account with this email already exists',
      });
    }

    // Attempt to match or find department if provided or based on specialization
    let matchedDeptId = department || null;
    if (!matchedDeptId && specialization) {
      const foundDept = await Department.findOne({
        name: new RegExp(`^${specialization}`, 'i'),
      });
      if (foundDept) {
        matchedDeptId = foundDept._id;
      }
    }

    const defaultSlots = [
      { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
    ];

    // 1. Create in Doctor model
    const doctor = await Doctor.create({
      name: name.trim(),
      email: emailLower,
      password,
      specialization,
      qualification: qualification.trim(),
      experience: Number(experience) || 0,
      consultationFee: Number(consultationFee) || 50,
      phone: phone.trim(),
      department: matchedDeptId,
      address: address.trim(),
      availability: defaultSlots,
      status: 'ACTIVE',
      role: 'DOCTOR',
    });

    // 2. Also ensure User record exists with role DOCTOR so existing appointment queries find this doctor
    try {
      await User.create({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        password, // User pre-save hook will hash this for the User collection
        role: 'DOCTOR',
        phone: doctor.phone,
        department: matchedDeptId,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        availability: defaultSlots,
        status: 'ACTIVE',
        address: doctor.address,
      });
    } catch (syncErr) {
      // If User collection sync fails due to id collision, continue with Doctor record
      console.warn('Note: User collection synchronization message:', syncErr.message);
    }

    const token = generateToken(doctor._id, 'DOCTOR');

    // Send system welcome notification
    await createNotification({
      userId: doctor._id,
      title: 'Welcome to EliteCare Hospital Clinical Portal',
      message: `Dr. ${doctor.name}, your attending physician profile in ${doctor.specialization} is active.`,
      type: 'SYSTEM',
    });

    const populatedDoctor = await Doctor.findById(doctor._id).populate('department');

    res.status(201).json({
      success: true,
      message: 'Physician registration successful',
      token,
      data: populatedDoctor,
      doctor: populatedDoctor,
      user: populatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate physician & get token
// @route   POST /api/doctors/login
// @access  Public
const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both physician email and clinical password',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid @gmail.com email address',
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Check Doctor model first
    let doctor = await Doctor.findOne({ email: emailLower })
      .select('+password')
      .populate('department');

    let isValid = false;

    if (doctor) {
      isValid = await doctor.matchPassword(password);
    }

    // Fallback: check User model if doctor was seeded/registered as User
    if (!doctor || !isValid) {
      const userDoc = await User.findOne({ email: emailLower, role: 'DOCTOR' })
        .select('+password')
        .populate('department');

      if (userDoc) {
        const isUserMatch = await userDoc.matchPassword(password);
        if (isUserMatch) {
          doctor = userDoc;
          isValid = true;
        }
      }
    }

    if (!doctor || !isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid physician email or password',
      });
    }

    if (doctor.status && doctor.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Physician account is deactivated. Contact medical administration.',
      });
    }

    const token = generateToken(doctor._id, 'DOCTOR');

    const doctorObject = doctor.toObject();
    delete doctorObject.password;
    doctorObject.role = 'DOCTOR';

    res.status(200).json({
      success: true,
      message: 'Doctor authentication successful',
      token,
      data: doctorObject,
      doctor: doctorObject,
      user: doctorObject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active physicians
// @route   GET /api/doctors
// @access  Public
const getAllDoctors = async (req, res, next) => {
  try {
    const { specialization, search } = req.query;
    const filter = { status: 'ACTIVE' };

    if (specialization) {
      filter.specialization = specialization;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { qualification: { $regex: search, $options: 'i' } },
      ];
    }

    let doctors = await Doctor.find(filter).populate('department').sort({ name: 1 });

    // Fallback if Doctor collection has fewer entries than User collection
    if (!doctors || doctors.length === 0) {
      doctors = await User.find({ role: 'DOCTOR', status: 'ACTIVE' })
        .populate('department')
        .sort({ name: 1 });
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single physician profile by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res, next) => {
  try {
    let doctor = await Doctor.findById(req.params.id).populate('department');

    if (!doctor) {
      doctor = await User.findOne({ _id: req.params.id, role: 'DOCTOR' }).populate('department');
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Physician profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  getAllDoctors,
  getDoctorById,
};
