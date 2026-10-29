const User = require('../models/User');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const LabReport = require('../models/LabReport');
const Bed = require('../models/Bed');
const Admission = require('../models/Admission');
const Bill = require('../models/Bill');

// @desc    Get Admin Dashboard Stats & 6 Real MongoDB Aggregation Charts
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // KPI Counts
    const totalPatients = await User.countDocuments({ role: 'PATIENT' });
    const totalDoctors = await User.countDocuments({ role: 'DOCTOR' });
    const totalUsers = await User.countDocuments();
    const todayAppointments = await Appointment.countDocuments({ date: todayStr });
    const totalAppointments = await Appointment.countDocuments();

    const availableBeds = await Bed.countDocuments({ status: 'AVAILABLE' });
    const occupiedBeds = await Bed.countDocuments({ status: 'OCCUPIED' });
    const totalBeds = await Bed.countDocuments();
    const bedOccupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    const pendingLabRequests = await LabReport.countDocuments({ requestStatus: { $in: ['REQUESTED', 'PROCESSING'] } });
    const lowStockMedicines = await Medicine.countDocuments({
      status: 'ACTIVE',
      $expr: { $lte: ['$stock', '$minimumStock'] },
    });
    const pendingBills = await Bill.countDocuments({ paymentStatus: 'PENDING' });

    // Revenue Calculation
    const revenueAgg = await Bill.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // CHART 1: Monthly Appointments (last 6 months aggregation)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyAppointmentsAgg = await Appointment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format monthly labels e.g. "Jan", "Feb"
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAppointments = monthlyAppointmentsAgg.map((item) => {
      const parts = item._id.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      return {
        month: `${monthNames[monthIdx]} ${parts[0].slice(-2)}`,
        appointments: item.count,
      };
    });

    // If empty, generate past 6 months placeholder with zero counts
    if (monthlyAppointments.length === 0) {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        monthlyAppointments.push({
          month: monthNames[d.getMonth()],
          appointments: 0,
        });
      }
    }

    // CHART 2: Patient Growth (cumulative or monthly registrations)
    const patientGrowthAgg = await User.aggregate([
      { $match: { role: 'PATIENT', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          patients: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const patientGrowth = patientGrowthAgg.map((item) => {
      const parts = item._id.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      return {
        month: `${monthNames[monthIdx]}`,
        patients: item.patients,
      };
    });

    // CHART 3: Department-wise Appointments
    const departmentWiseAgg = await Appointment.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept',
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$dept.name',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const departmentWiseAppointments = departmentWiseAgg.map((d) => ({
      name: d._id || 'General',
      count: d.count,
    }));

    // CHART 4: Bed Occupancy Distribution
    const bedDistribution = [
      { name: 'Available', value: availableBeds, color: '#10b981' },
      { name: 'Occupied', value: occupiedBeds, color: '#ef4444' },
      { name: 'Maintenance', value: await Bed.countDocuments({ status: 'MAINTENANCE' }), color: '#f59e0b' },
    ];

    // CHART 5: Revenue Overview (Monthly Paid Bills)
    const monthlyRevenueAgg = await Bill.aggregate([
      { $match: { paymentStatus: 'PAID', paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueOverview = monthlyRevenueAgg.map((r) => {
      const parts = r._id.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      return {
        month: `${monthNames[monthIdx]}`,
        revenue: r.revenue,
      };
    });

    // CHART 6: Medicine Stock Status
    const medicineStockLevels = await Medicine.find({ status: 'ACTIVE' })
      .select('name stock minimumStock')
      .sort('stock')
      .limit(8);

    const medicineStockChart = medicineStockLevels.map((m) => ({
      name: m.name.length > 10 ? `${m.name.slice(0, 10)}...` : m.name,
      stock: m.stock,
      minStock: m.minimumStock,
    }));

    // Recent 5 Appointments
    const recentAppointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalPatients,
          totalDoctors,
          totalUsers,
          todayAppointments,
          totalAppointments,
          availableBeds,
          occupiedBeds,
          totalBeds,
          bedOccupancyRate,
          pendingLabRequests,
          lowStockMedicines,
          pendingBills,
          totalRevenue,
        },
        charts: {
          monthlyAppointments,
          patientGrowth,
          departmentWiseAppointments,
          bedDistribution,
          revenueOverview,
          medicineStockChart,
        },
        recentAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Doctor Dashboard Stats & Data
// @route   GET /api/dashboard/doctor
// @access  Private/Doctor
const getDoctorDashboard = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const todayStr = new Date().toISOString().split('T')[0];

    const todayAppointments = await Appointment.find({ doctor: doctorId, date: todayStr })
      .populate('patient', 'name phone gender dateOfBirth bloodGroup')
      .populate('department', 'name')
      .sort('time');

    const upcomingAppointmentsCount = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: todayStr },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });

    // Unique patients attended by this doctor
    const uniquePatientsAgg = await Appointment.distinct('patient', { doctor: doctorId });
    const totalPatients = uniquePatientsAgg.length;

    const pendingLabReportsCount = await LabReport.countDocuments({
      doctor: doctorId,
      requestStatus: { $in: ['REQUESTED', 'PROCESSING'] },
    });

    const recentRecords = await MedicalRecord.find({ doctor: doctorId })
      .populate('patient', 'name email gender')
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingLabs = await LabReport.find({
      doctor: doctorId,
      requestStatus: { $in: ['REQUESTED', 'PROCESSING'] },
    })
      .populate('patient', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          todayAppointmentsCount: todayAppointments.length,
          upcomingAppointmentsCount,
          totalPatients,
          pendingLabReportsCount,
        },
        todayAppointments,
        recentRecords,
        pendingLabs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Patient Dashboard Stats & Data
// @route   GET /api/dashboard/patient
// @access  Private/Patient
const getPatientDashboard = async (req, res, next) => {
  try {
    const patientId = req.user._id;
    const todayStr = new Date().toISOString().split('T')[0];

    const totalAppointments = await Appointment.countDocuments({ patient: patientId });
    const upcomingAppointments = await Appointment.find({
      patient: patientId,
      date: { $gte: todayStr },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    })
      .populate('doctor', 'name specialization consultationFee')
      .populate('department', 'name')
      .sort({ date: 1, time: 1 })
      .limit(5);

    const medicalRecordsCount = await MedicalRecord.countDocuments({ patient: patientId });
    const prescriptionsCount = await Prescription.countDocuments({ patient: patientId });
    const labReportsCount = await LabReport.countDocuments({ patient: patientId });

    const pendingBills = await Bill.find({ patient: patientId, paymentStatus: 'PENDING' })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentMedicalRecords = await MedicalRecord.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(3);

    const recentPrescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          upcomingAppointmentsCount: upcomingAppointments.length,
          totalAppointments,
          medicalRecordsCount,
          prescriptionsCount,
          labReportsCount,
          pendingBillsCount: pendingBills.length,
        },
        upcomingAppointments,
        pendingBills,
        recentMedicalRecords,
        recentPrescriptions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Lab Dashboard Stats & Data
// @route   GET /api/dashboard/lab
// @access  Private/Lab
const getLabDashboard = async (req, res, next) => {
  try {
    const pendingRequests = await LabReport.countDocuments({ requestStatus: 'REQUESTED' });
    const processingTests = await LabReport.countDocuments({ requestStatus: 'PROCESSING' });
    const completedReports = await LabReport.countDocuments({ requestStatus: 'COMPLETED' });

    const recentRequests = await LabReport.find()
      .populate('patient', 'name phone gender')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          pendingRequests,
          processingTests,
          completedReports,
          total: pendingRequests + processingTests + completedReports,
        },
        recentRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Pharmacy Dashboard Stats & Data
// @route   GET /api/dashboard/pharmacy
// @access  Private/Pharmacy
const getPharmacyDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const totalMedicines = await Medicine.countDocuments({ status: 'ACTIVE' });

    const lowStockCount = await Medicine.countDocuments({
      status: 'ACTIVE',
      $expr: { $lte: ['$stock', '$minimumStock'] },
    });

    const expiringCount = await Medicine.countDocuments({
      status: 'ACTIVE',
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
    });

    const pendingPrescriptionsCount = await Prescription.countDocuments({ status: 'ACTIVE' });

    const recentPrescriptions = await Prescription.find({ status: 'ACTIVE' })
      .populate('patient', 'name phone gender')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(6);

    const lowStockItems = await Medicine.find({
      status: 'ACTIVE',
      $expr: { $lte: ['$stock', '$minimumStock'] },
    })
      .sort('stock')
      .limit(6);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalMedicines,
          lowStockCount,
          expiringCount,
          pendingPrescriptionsCount,
        },
        recentPrescriptions,
        lowStockItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getDoctorDashboard,
  getPatientDashboard,
  getLabDashboard,
  getPharmacyDashboard,
};
