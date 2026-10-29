const express = require('express');
const router = express.Router();
const {
  getBeds,
  getBedOccupancy,
  getBedById,
  createBed,
  updateBed,
  deleteBed,
} = require('../controllers/bedController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/occupancy', authorizeRoles('ADMIN', 'DOCTOR'), getBedOccupancy);
router.get('/summary', authorizeRoles('ADMIN', 'DOCTOR'), getBedOccupancy);
router.get('/', authorizeRoles('ADMIN', 'DOCTOR'), getBeds);
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR'), getBedById);
router.post('/', authorizeRoles('ADMIN'), createBed);
router.put('/:id', authorizeRoles('ADMIN'), updateBed);
router.delete('/:id', authorizeRoles('ADMIN'), deleteBed);

module.exports = router;
