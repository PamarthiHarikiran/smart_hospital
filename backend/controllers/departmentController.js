const Department = require('../models/Department');
const { recommendDepartment } = require('../utils/departmentRecommender');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
const getDepartments = async (req, res, next) => {
  try {
    const { status = 'ACTIVE' } = req.query;
    const query = status === 'ALL' ? {} : { status };
    const departments = await Department.find(query).sort('name');

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Public
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
      });
    }

    const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists',
      });
    }

    const department = await Department.create({ name, description });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Smart recommendation: Recommend department from symptoms
// @route   POST /api/departments/recommend
// @access  Public / Private
const recommend = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptoms description',
      });
    }

    const recommendation = recommendDepartment(symptoms);

    // Look up matching department record in DB if available
    const deptDoc = await Department.findOne({
      name: { $regex: new RegExp(`^${recommendation.recommendedDepartment}$`, 'i') },
      status: 'ACTIVE',
    });

    res.status(200).json({
      success: true,
      data: {
        ...recommendation,
        departmentId: deptDoc ? deptDoc._id : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  recommend,
};
