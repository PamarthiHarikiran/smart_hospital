const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Department = require('../models/Department');
const { createNotification } = require('../utils/notificationHelper');

const DEFAULT_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

// @desc    Get available slots for a doctor on a specific date (Smart Feature 2)
// @route   GET /api/appointments/available-slots
// @access  Public / Private
const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both doctorId and date (YYYY-MM-DD)',
      });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Determine day of the week
    const dateObj = new Date(`${date}T00:00:00`);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    // Doctor custom availability if defined, or fallback to standard slots
    let doctorSlots = DEFAULT_SLOTS;
    if (doctor.availability && doctor.availability.length > 0) {
      const daySchedule = doctor.availability.find(
        (a) => a.day.toLowerCase() === dayOfWeek.toLowerCase()
      );
      if (daySchedule && daySchedule.slots && daySchedule.slots.length > 0) {
        doctorSlots = daySchedule.slots;
      }
    }

    // Find active appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    }).select('time');

    const bookedTimes = bookedAppointments.map((a) => a.time);

    const availableSlots = doctorSlots.filter((slot) => !bookedTimes.includes(slot));
    const earliestSlot = availableSlots.length > 0 ? availableSlots[0] : null;

    res.status(200).json({
      success: true,
      data: {
        date,
        dayOfWeek,
        doctor: {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee,
        },
        allSlots: doctorSlots,
        bookedSlots: bookedTimes,
        availableSlots,
        earliestSlot,
        hasAvailability: availableSlots.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (Patient, Admin, Doctor)
const createAppointment = async (req, res, next) => {
  try {
    const { doctor, department, date, time, reason, notes } = req.body;
    let patient = req.body.patient;

    // Default patient to current user if role is PATIENT
    if (req.user.role === 'PATIENT') {
      patient = req.user._id;
    } else if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    if (!doctor || !date || !time || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, date, time, and reason are required',
      });
    }

    // Verify doctor
    const doctorUser = await User.findById(doctor);
    if (!doctorUser || doctorUser.role !== 'DOCTOR') {
      return res.status(404).json({
        success: false,
        message: 'Invalid doctor selected',
      });
    }

    // Auto-fill department from doctor if not provided
    const targetDepartment = department || doctorUser.department;
    if (!targetDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department is required for this appointment',
      });
    }

    // CRITICAL: Double-booking prevention server-side check
    const conflict = await Appointment.findOne({
      doctor,
      date,
      time,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `This time slot (${time} on ${date}) is already booked for Dr. ${doctorUser.name}. Please select another slot.`,
      });
    }

    // Check if the patient already has an active appointment at the exact same date & time
    const patientConflict = await Appointment.findOne({
      patient,
      date,
      time,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });

    if (patientConflict) {
      return res.status(409).json({
        success: false,
        message: `You already have an appointment booked at ${time} on ${date}.`,
      });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      department: targetDepartment,
      date,
      time,
      reason,
      notes: notes || '',
      status: 'CONFIRMED', // Confirm by default or pending
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization consultationFee')
      .populate('department', 'name');

    // Send notifications to Doctor and Patient
    const patientUser = await User.findById(patient);
    await createNotification({
      userId: doctor,
      title: 'New Appointment Scheduled',
      message: `Patient ${patientUser ? patientUser.name : 'Unknown'} booked an appointment for ${date} at ${time}.`,
      type: 'APPOINTMENT',
      link: '/doctor/appointments',
    });

    await createNotification({
      userId: patient,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctorUser.name} on ${date} at ${time} is confirmed.`,
      type: 'APPOINTMENT',
      link: '/patient/appointments',
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments (filtered by role / search / date / pagination)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const {
      status,
      date,
      doctor,
      patient,
      department,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const query = {};

    // Role-specific scoping
    if (req.user.role === 'PATIENT') {
      query.patient = req.user._id;
    } else if (req.user.role === 'DOCTOR') {
      query.doctor = req.user._id;
    }

    // Query filters
    if (status) query.status = status.toUpperCase();
    if (date) query.date = date;
    if (doctor && req.user.role !== 'DOCTOR') query.doctor = doctor;
    if (patient && req.user.role !== 'PATIENT') query.patient = patient;
    if (department) query.department = department;

    if (search) {
      query.reason = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone gender bloodGroup')
      .populate('doctor', 'name specialization consultationFee email phone')
      .populate('department', 'name')
      .sort({ date: -1, time: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: appointments,
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

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone gender bloodGroup dateOfBirth address')
      .populate('doctor', 'name specialization consultationFee email phone department')
      .populate('department', 'name description');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Authorization check
    if (
      req.user.role === 'PATIENT' &&
      appointment.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to appointment details',
      });
    }

    if (
      req.user.role === 'DOCTOR' &&
      appointment.doctor._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to appointment details',
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status or notes
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Authorization check
    if (
      req.user.role === 'PATIENT' &&
      appointment.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this appointment',
      });
    }

    if (
      req.user.role === 'DOCTOR' &&
      appointment.doctor._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this appointment',
      });
    }

    const { status, notes, date, time } = req.body;

    // If rescheduling, check for slot conflicts
    if ((date && date !== appointment.date) || (time && time !== appointment.time)) {
      const newDate = date || appointment.date;
      const newTime = time || appointment.time;

      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: appointment.doctor._id,
        date: newDate,
        time: newTime,
        status: { $in: ['PENDING', 'CONFIRMED'] },
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Slot ${newTime} on ${newDate} is already booked.`,
        });
      }

      appointment.date = newDate;
      appointment.time = newTime;
    }

    if (status) {
      // Patients can only cancel appointments
      if (req.user.role === 'PATIENT' && status !== 'CANCELLED') {
        return res.status(403).json({
          success: false,
          message: 'Patients can only cancel appointments',
        });
      }
      appointment.status = status;
    }

    if (notes !== undefined) {
      appointment.notes = notes;
    }

    const updated = await appointment.save();

    // Trigger notification
    if (status) {
      const targetUserId =
        req.user.role === 'PATIENT' ? appointment.doctor._id : appointment.patient._id;
      await createNotification({
        userId: targetUserId,
        title: `Appointment Status Updated: ${status}`,
        message: `Appointment on ${appointment.date} at ${appointment.time} has been marked as ${status}.`,
        type: 'APPOINTMENT',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Admin or cancelling patient)
const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (
      req.user.role === 'PATIENT' &&
      appointment.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Soft cancel if patient, or hard remove if admin
    if (req.user.role === 'PATIENT') {
      appointment.status = 'CANCELLED';
      await appointment.save();
      return res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
