const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  createAlert,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getActiveCount,
} = require('../controllers/emergencyAlertController');

router.use(protect);

router.post('/', authorizeRoles('PATIENT', 'ADMIN'), createAlert);
router.get('/', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), getAlerts);
router.get('/active-count', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), getActiveCount);
router.get('/:id', authorizeRoles('PATIENT', 'DOCTOR', 'ADMIN'), getAlertById);
router.patch('/:id/acknowledge', authorizeRoles('DOCTOR', 'ADMIN'), acknowledgeAlert);
router.patch('/:id/resolve', authorizeRoles('DOCTOR', 'ADMIN'), resolveAlert);

module.exports = router;
