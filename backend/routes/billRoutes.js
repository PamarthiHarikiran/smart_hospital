const express = require('express');
const router = express.Router();
const {
  createBill,
  getBills,
  getBillById,
  updateBill,
  processPayment,
} = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorizeRoles('ADMIN'), createBill);
router.get('/', authorizeRoles('ADMIN', 'PATIENT'), getBills);
router.get('/:id', authorizeRoles('ADMIN', 'PATIENT'), getBillById);
router.put('/:id', authorizeRoles('ADMIN'), updateBill);
router.put('/:id/payment', authorizeRoles('ADMIN', 'PATIENT'), processPayment);
router.put('/:id/pay', authorizeRoles('ADMIN', 'PATIENT'), processPayment);

module.exports = router;
