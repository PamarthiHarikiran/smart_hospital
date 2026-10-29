const express = require('express');
const router = express.Router();
const {
  createLabRequest,
  getLabReports,
  getLabReportById,
  updateLabReport,
} = require('../controllers/labReportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/', authorizeRoles('DOCTOR', 'ADMIN'), createLabRequest);
router.get('/', authorizeRoles('LAB', 'DOCTOR', 'PATIENT', 'ADMIN'), getLabReports);
router.get('/:id', authorizeRoles('LAB', 'DOCTOR', 'PATIENT', 'ADMIN'), getLabReportById);
router.put('/:id', authorizeRoles('LAB', 'ADMIN', 'DOCTOR'), upload.single('reportFile'), updateLabReport);

module.exports = router;
