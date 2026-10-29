const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorizeRoles('DOCTOR', 'ADMIN'), createPrescription);
router.get('/', authorizeRoles('DOCTOR', 'PATIENT', 'PHARMACY', 'ADMIN'), getPrescriptions);
router.get('/:id', authorizeRoles('DOCTOR', 'PATIENT', 'PHARMACY', 'ADMIN'), getPrescriptionById);
router.put('/:id', authorizeRoles('DOCTOR', 'PHARMACY', 'ADMIN'), updatePrescription);

module.exports = router;
