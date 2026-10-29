const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getDoctorDashboard,
  getPatientDashboard,
  getLabDashboard,
  getPharmacyDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/overview', (req, res, next) => {
  if (req.user.role === 'ADMIN') return getAdminDashboard(req, res, next);
  if (req.user.role === 'DOCTOR') return getDoctorDashboard(req, res, next);
  if (req.user.role === 'PATIENT') return getPatientDashboard(req, res, next);
  if (req.user.role === 'LAB') return getLabDashboard(req, res, next);
  if (req.user.role === 'PHARMACY') return getPharmacyDashboard(req, res, next);
  return getAdminDashboard(req, res, next);
});
router.get('/admin', authorizeRoles('ADMIN'), getAdminDashboard);
router.get('/doctor', authorizeRoles('DOCTOR'), getDoctorDashboard);
router.get('/patient', authorizeRoles('PATIENT'), getPatientDashboard);
router.get('/lab', authorizeRoles('LAB', 'ADMIN'), getLabDashboard);
router.get('/pharmacy', authorizeRoles('PHARMACY', 'ADMIN'), getPharmacyDashboard);

module.exports = router;
