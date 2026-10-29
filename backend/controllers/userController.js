const User = require('../models/User');

// @desc    Get all users with search, role filter, pagination
// @route   GET /api/users
// @access  Private/Admin (or authenticated users for doctors/staff)
const getUsers = async (req, res, next) => {
  try {
    const {
      role,
      department,
      search,
      status,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (role) {
      query.role = role.toUpperCase();
    }
    if (department) {
      query.department = department;
    }
    if (status) {
      query.status = status.toUpperCase();
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('department')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctors specifically (public/authenticated for appointment booking)
// @route   GET /api/users/doctors
// @access  Public / Private
const getDoctors = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const query = { role: 'DOCTOR', status: 'ACTIVE' };

    if (department) {
      query.department = department;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { qualification: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await User.find(query)
      .populate('department')
      .sort('name');

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('department');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Role safety: non-admin can only view their own profile or public doctor profiles
  // Role-based profile access
const requesterRole = req.user.role?.toUpperCase();
const requesterId = req.user._id.toString();
const targetId = user._id.toString();

// Admins and users viewing their own profile are allowed
const isAdmin = requesterRole === 'ADMIN';
const isSelf = requesterId === targetId;

// Doctors can view patient profiles
const isDoctorViewingPatient =
  requesterRole === 'DOCTOR' && user.role === 'PATIENT';

// Allow access only under the defined rules
if (!isAdmin && !isSelf && !isDoctorViewingPatient && user.role !== 'DOCTOR') {
  return res.status(403).json({
    success: false,
    message: 'Not authorized to view this profile',
  });
}

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin or Self)
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }

    const updateData = { ...req.body };
    delete updateData.password; // Password changes handled separately

    // Only admin can change role or status
    if (req.user.role !== 'ADMIN') {
      delete updateData.role;
      delete updateData.status;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('department');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or deactivate user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting self
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getDoctors,
  getUserById,
  updateUser,
  deleteUser,
};
