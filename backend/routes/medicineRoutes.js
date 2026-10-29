const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineAlerts,
  getMedicineById,
  createMedicine,
  updateMedicine,
  updateStock,
  deleteMedicine,
} = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/alerts', authorizeRoles('PHARMACY', 'ADMIN'), getMedicineAlerts);
router.get('/alerts/all', authorizeRoles('PHARMACY', 'ADMIN'), getMedicineAlerts);
router.get('/', authorizeRoles('PHARMACY', 'ADMIN', 'DOCTOR', 'PATIENT'), getMedicines);
router.get('/:id', authorizeRoles('PHARMACY', 'ADMIN', 'DOCTOR'), getMedicineById);
router.post('/', authorizeRoles('PHARMACY', 'ADMIN'), createMedicine);
router.put('/:id', authorizeRoles('PHARMACY', 'ADMIN'), updateMedicine);
router.put('/:id/stock', authorizeRoles('PHARMACY', 'ADMIN'), updateStock);
router.delete('/:id', authorizeRoles('PHARMACY', 'ADMIN'), deleteMedicine);

module.exports = router;
