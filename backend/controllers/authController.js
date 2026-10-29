const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { createNotification } = require('../utils/notificationHelper');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'PATIENT',
      phone,
      gender,
      bloodGroup,
      dateOfBirth,
      address,
      department,
      specialization,
      qualification,
      consultationFee,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid @gmail.com email address',
      });
    }

    if (phone && phone.trim() !== '' && !PHONE_REGEX.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please fill a valid mobile/contact number',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      gender,
      bloodGroup,
      dateOfBirth,
      address,
    };

    if (role === 'DOCTOR') {
      userData.department = department || null;
      userData.specialization = specialization || '';
      userData.qualification = qualification || '';
      userData.consultationFee = consultationFee || 50;
      userData.availability = [
        { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      ];
    }

    const user = await User.create(userData);

    const token = generateToken(user._id, user.role);

    // Notify user of welcome
    await createNotification({
      userId: user._id,
      title: 'Welcome to EliteCare Hospital',
      message: `Hello ${user.name}, your ${user.role.toLowerCase()} account has been successfully created.`,
      type: 'SYSTEM',
    });

    const userResponse = await User.findById(user._id).populate('department');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse,
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid @gmail.com email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('department');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administration.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userObject,
      data: userObject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('department');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const allowedFields = [
      'name',
      'phone',
      'gender',
      'bloodGroup',
      'dateOfBirth',
      'address',
      'specialization',
      'qualification',
      'consultationFee',
      'availability',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();
    const populated = await User.findById(updatedUser._id).populate('department');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
};
