const express = require('express');
const router = express.Router();
const {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorizeRoles('DOCTOR', 'ADMIN'), createMedicalRecord);
router.get('/', authorizeRoles('DOCTOR', 'PATIENT', 'ADMIN'), getMedicalRecords);
router.get('/:id', authorizeRoles('DOCTOR', 'PATIENT', 'ADMIN'), getMedicalRecordById);
router.put('/:id', authorizeRoles('DOCTOR', 'ADMIN'), updateMedicalRecord);

module.exports = router;
