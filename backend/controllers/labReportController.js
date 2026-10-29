const LabReport = require('../models/LabReport');
const { createNotification } = require('../utils/notificationHelper');
let ioInstance = null;

const setLabReportSocketIO = (io) => {
  ioInstance = io;
};

const getSocketIO = () => {
  if (ioInstance) return ioInstance;
  try {
    const { getIO } = require('../socket/socketHandler');
    return getIO();
  } catch {
    return null;
  }
};

// @desc    Request a lab test
// @route   POST /api/lab-reports
// @access  Private (Doctor, Admin)
const createLabRequest = async (req, res, next) => {
  try {
    const {
      patient,
      appointment,
      testName,
      testCategory,
      testDescription,
      sampleType,
      price,
    } = req.body;
    const doctor = req.user._id;

    if (!patient || !testName) {
      return res.status(400).json({
        success: false,
        message: 'Patient and testName are required',
      });
    }

    const labReport = await LabReport.create({
      patient,
      doctor,
      appointment: appointment || null,
      testName,
      testCategory: testCategory || 'Clinical Pathology',
      testDescription: testDescription || '',
      sampleType: sampleType || 'Whole Blood (EDTA)',
      price: price !== undefined ? Number(price) : 0,
      requestStatus: 'REQUESTED',
      requestedAt: new Date(),
      statusHistory: [
        {
          status: 'REQUESTED',
          timestamp: new Date(),
          updatedBy: req.user.name || 'Attending Physician',
          note: `Investigation ordered by Dr. ${req.user.name}`,
        },
      ],
    });

    const populated = await LabReport.findById(labReport._id)
      .populate('patient', 'name email phone gender bloodGroup')
      .populate('doctor', 'name specialization email phone')
      .populate('appointment');

    await createNotification({
      userId: patient,
      title: 'Lab Test Requested',
      message: `Dr. ${req.user.name} requested laboratory test: "${testName}".`,
      type: 'LAB',
      link: '/patient/lab-reports',
    });

    // Real-time broadcast
    const io = getSocketIO();
    if (io) {
      io.to(`user:${patient.toString()}`).emit('lab_report_status_changed', {
        reportId: populated._id,
        requestStatus: 'REQUESTED',
        report: populated,
      });
      io.to('lab_staff').emit('lab_report_status_changed', {
        reportId: populated._id,
        requestStatus: 'REQUESTED',
        report: populated,
      });
      io.to('admin_room').emit('lab_report_status_changed', {
        reportId: populated._id,
        requestStatus: 'REQUESTED',
        report: populated,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Laboratory test requested successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lab reports / requests
// @route   GET /api/lab-reports
// @access  Private (Lab, Doctor, Patient, Admin)
const getLabReports = async (req, res, next) => {
  try {
    const { requestStatus, patient, doctor, page = 1, limit = 10, search } = req.query;
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
      // LAB or ADMIN can view all
      if (patient) query.patient = patient;
      if (doctor) query.doctor = doctor;
    }

    if (requestStatus) {
      if (requestStatus.includes(',')) {
        query.requestStatus = { $in: requestStatus.split(',').map((s) => s.trim().toUpperCase()) };
      } else {
        query.requestStatus = requestStatus.toUpperCase();
      }
    }

    if (search) {
      query.$or = [
        { testName: { $regex: search, $options: 'i' } },
        { reportId: { $regex: search, $options: 'i' } },
        { testDescription: { $regex: search, $options: 'i' } },
        { result: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await LabReport.countDocuments(query);
    const labReports = await LabReport.find(query)
      .populate('patient', 'name email phone gender bloodGroup')
      .populate('doctor', 'name specialization')
      .populate('appointment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: labReports,
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

// @desc    Get single lab report
// @route   GET /api/lab-reports/:id
// @access  Private
const getLabReportById = async (req, res, next) => {
  try {
    const labReport = await LabReport.findById(req.params.id)
      .populate('patient', 'name email phone gender bloodGroup address')
      .populate('doctor', 'name specialization email phone')
      .populate('appointment');

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory report not found',
      });
    }

    if (
      req.user.role === 'PATIENT' &&
      labReport.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view this laboratory report',
      });
    }

    res.status(200).json({
      success: true,
      data: labReport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lab report / Process / Verify results
// @route   PUT /api/lab-reports/:id
// @access  Private (Lab, Admin, Doctor)
const updateLabReport = async (req, res, next) => {
  try {
    const labReport = await LabReport.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory report not found',
      });
    }

    const {
      requestStatus,
      result,
      remarks,
      price,
      sampleType,
      sampleCollectedAt,
      sampleCollectedBy,
      parameters,
      verifiedBy,
      technician,
      testCategory,
      statusNote,
    } = req.body;

    const oldStatus = labReport.requestStatus;
    const newStatus = requestStatus ? requestStatus.toUpperCase() : oldStatus;

    if (requestStatus) {
      labReport.requestStatus = newStatus;

      if (newStatus === 'SAMPLE_COLLECTED') {
        if (!labReport.sampleCollectedAt) labReport.sampleCollectedAt = new Date();
        if (sampleCollectedBy) labReport.sampleCollectedBy = sampleCollectedBy;
      } else if (newStatus === 'PROCESSING') {
        if (!labReport.processingStartedAt) labReport.processingStartedAt = new Date();
      } else if (newStatus === 'COMPLETED') {
        if (!labReport.completedAt) labReport.completedAt = new Date();
      } else if (newStatus === 'VERIFIED') {
        if (!labReport.completedAt) labReport.completedAt = new Date();
        if (!labReport.verifiedAt) labReport.verifiedAt = new Date();
        if (!labReport.verifiedBy?.name) {
          labReport.verifiedBy = {
            name: verifiedBy?.name || req.user.name || 'Dr. Arthur Conan, MD',
            designation: verifiedBy?.designation || 'Chief Consultant Pathologist',
            licenseNumber: verifiedBy?.licenseNumber || 'MED-PATH-88492',
          };
        }
      }

      // Record status transition in audit history if status changed or note provided
      if (oldStatus !== newStatus || statusNote) {
        labReport.statusHistory.push({
          status: newStatus,
          timestamp: new Date(),
          updatedBy: req.user.name || 'Laboratory Staff',
          note: statusNote || `Status changed from ${oldStatus} to ${newStatus}`,
        });
      }
    }

    if (result !== undefined) labReport.result = result;
    if (remarks !== undefined) labReport.remarks = remarks;
    if (price !== undefined) labReport.price = Number(price);
    if (sampleType !== undefined) labReport.sampleType = sampleType;
    if (sampleCollectedAt) labReport.sampleCollectedAt = new Date(sampleCollectedAt);
    if (sampleCollectedBy !== undefined) labReport.sampleCollectedBy = sampleCollectedBy;
    if (testCategory !== undefined) labReport.testCategory = testCategory;

    if (parameters !== undefined) {
      // Support array of parameters
      let parsedParams = parameters;
      if (typeof parameters === 'string') {
        try {
          parsedParams = JSON.parse(parameters);
        } catch {
          parsedParams = [];
        }
      }
      if (Array.isArray(parsedParams)) {
        labReport.parameters = parsedParams;
      }
    }

    if (verifiedBy && typeof verifiedBy === 'object') {
      labReport.verifiedBy = {
        name: verifiedBy.name || labReport.verifiedBy?.name || '',
        designation: verifiedBy.designation || labReport.verifiedBy?.designation || 'Chief Consultant Pathologist',
        licenseNumber: verifiedBy.licenseNumber || labReport.verifiedBy?.licenseNumber || 'MED-PATH-88492',
      };
      if (verifiedBy.verifiedAt) labReport.verifiedAt = new Date(verifiedBy.verifiedAt);
    }

    if (technician && typeof technician === 'object') {
      labReport.technician = {
        name: technician.name || labReport.technician?.name || '',
        role: technician.role || labReport.technician?.role || 'Senior Medical Laboratory Technologist',
      };
    }

    // If PDF file was uploaded via Multer
    if (req.file) {
      labReport.reportFile = `/uploads/${req.file.filename}`;
    }

    const updated = await labReport.save();
    const populated = await LabReport.findById(updated._id)
      .populate('patient', 'name email phone gender bloodGroup')
      .populate('doctor', 'name specialization email phone')
      .populate('appointment');

    // Real-Time Socket.IO Broadcast to Patient, Doctor, Lab Staff & Admins
    const io = getSocketIO();
    if (io) {
      // Broadcast to specific lab report room
      io.to(`lab_report:${labReport._id}`).emit('lab_report_updated', populated);

      // Broadcast to personal user rooms
      if (labReport.patient?._id) {
        io.to(`user:${labReport.patient._id.toString()}`).emit('lab_report_status_changed', {
          reportId: labReport._id,
          requestStatus: labReport.requestStatus,
          report: populated,
        });
      }

      if (labReport.doctor?._id) {
        io.to(`user:${labReport.doctor._id.toString()}`).emit('lab_report_status_changed', {
          reportId: labReport._id,
          requestStatus: labReport.requestStatus,
          report: populated,
        });
      }

      // Broadcast to hospital staff
      io.to('lab_staff').emit('lab_report_status_changed', {
        reportId: labReport._id,
        requestStatus: labReport.requestStatus,
        report: populated,
      });

      io.to('admin_room').emit('lab_report_status_changed', {
        reportId: labReport._id,
        requestStatus: labReport.requestStatus,
        report: populated,
      });
    }

    // In-App Notifications on key milestones
    if (['SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED'].includes(newStatus) && oldStatus !== newStatus) {
      const statusLabels = {
        SAMPLE_COLLECTED: 'Specimen Collected',
        PROCESSING: 'In Processing',
        COMPLETED: 'Testing Completed',
        VERIFIED: 'Report Verified & Published',
      };

      await createNotification({
        userId: labReport.patient._id,
        title: `Lab Status: ${statusLabels[newStatus]}`,
        message: `Your diagnostic report for "${labReport.testName}" is now ${statusLabels[newStatus].toLowerCase()}.`,
        type: 'LAB',
        link: '/patient/lab-reports',
      });

      if (newStatus === 'VERIFIED' || newStatus === 'COMPLETED') {
        await createNotification({
          userId: labReport.doctor._id,
          title: `Lab Report Verified: ${labReport.patient.name}`,
          message: `Official verified laboratory results for patient ${labReport.patient.name} ("${labReport.testName}") are ready for clinical review.`,
          type: 'LAB',
          link: '/doctor/lab-reports',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Laboratory report updated successfully (${labReport.requestStatus})`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLabRequest,
  getLabReports,
  getLabReportById,
  updateLabReport,
  setLabReportSocketIO,
};
