const express = require('express');
const router = express.Router();
const {
  registerDoctor,
  loginDoctor,
  getAllDoctors,
  getDoctorById,
} = require('../controllers/doctorController');

// Doctor registration & login
router.post('/register', registerDoctor);
router.post('/login', loginDoctor);

// Public doctor directory endpoints
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

module.exports = router;
