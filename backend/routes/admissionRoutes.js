const express = require('express');
const router = express.Router();
const {
  createAdmission,
  getAdmissions,
  getAdmissionById,
  updateAdmission,
  dischargePatient,
} = require('../controllers/admissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorizeRoles('ADMIN', 'DOCTOR'), createAdmission);
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'PATIENT'), getAdmissions);
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'PATIENT'), getAdmissionById);
router.put('/:id', authorizeRoles('ADMIN', 'DOCTOR'), updateAdmission);
router.put('/:id/discharge', authorizeRoles('ADMIN', 'DOCTOR'), dischargePatient);

module.exports = router;
