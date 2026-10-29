const express = require('express');
const router = express.Router();
const {
  getUsers,
  getDoctors,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/doctors', getDoctors);

router.use(protect);

router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'LAB', 'PHARMACY'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorizeRoles('ADMIN'), deleteUser);

module.exports = router;
