const Bed = require('../models/Bed');

// @desc    Get all beds with search, ward filter, status filter, pagination
// @route   GET /api/beds
// @access  Private (Admin, Doctor, Staff)
const getBeds = async (req, res, next) => {
  try {
    const { status, ward, bedType, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status.toUpperCase();
    if (ward) query.ward = ward;
    if (bedType) query.bedType = bedType.toUpperCase();

    if (search) {
      query.$or = [
        { bedNumber: { $regex: search, $options: 'i' } },
        { ward: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Bed.countDocuments(query);
    const beds = await Bed.find(query)
      .sort('bedNumber')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: beds,
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

// @desc    Get bed occupancy statistics (Smart Feature 4)
// @route   GET /api/beds/occupancy
// @access  Private (Admin, Doctor, Staff)
const getBedOccupancy = async (req, res, next) => {
  try {
    const totalBeds = await Bed.countDocuments();
    const availableBeds = await Bed.countDocuments({ status: 'AVAILABLE' });
    const occupiedBeds = await Bed.countDocuments({ status: 'OCCUPIED' });
    const maintenanceBeds = await Bed.countDocuments({ status: 'MAINTENANCE' });

    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

    // Ward-wise breakdown
    const wardBreakdown = await Bed.aggregate([
      {
        $group: {
          _id: '$ward',
          total: { $sum: 1 },
          occupied: {
            $sum: {
              $cond: [{ $eq: ['$status', 'OCCUPIED'] }, 1, 0],
            },
          },
          available: {
            $sum: {
              $cond: [{ $eq: ['$status', 'AVAILABLE'] }, 1, 0],
            },
          },
          maintenance: {
            $sum: {
              $cond: [{ $eq: ['$status', 'MAINTENANCE'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          ward: '$_id',
          total: 1,
          occupied: 1,
          available: 1,
          maintenance: 1,
          rate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$occupied', '$total'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { ward: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBeds,
        availableBeds,
        occupiedBeds,
        maintenanceBeds,
        occupancyRate: Number(occupancyRate),
        wardBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bed
// @route   GET /api/beds/:id
// @access  Private
const getBedById = async (req, res, next) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    res.status(200).json({
      success: true,
      data: bed,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new bed
// @route   POST /api/beds
// @access  Private/Admin
const createBed = async (req, res, next) => {
  try {
    const { bedNumber, ward, bedType, status } = req.body;

    if (!bedNumber || !ward) {
      return res.status(400).json({
        success: false,
        message: 'Bed number and ward are required',
      });
    }

    const existing = await Bed.findOne({ bedNumber: bedNumber.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Bed ${bedNumber} already exists in the system`,
      });
    }

    const bed = await Bed.create({
      bedNumber: bedNumber.trim(),
      ward: ward.trim(),
      bedType: bedType ? bedType.toUpperCase() : 'GENERAL',
      status: status ? status.toUpperCase() : 'AVAILABLE',
    });

    res.status(201).json({
      success: true,
      message: 'Bed added successfully',
      data: bed,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bed
// @route   PUT /api/beds/:id
// @access  Private/Admin
const updateBed = async (req, res, next) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    const updated = await Bed.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Bed updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bed
// @route   DELETE /api/beds/:id
// @access  Private/Admin
const deleteBed = async (req, res, next) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    if (bed.status === 'OCCUPIED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied bed. Discharge the patient first.',
      });
    }

    await Bed.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Bed deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBeds,
  getBedOccupancy,
  getBedById,
  createBed,
  updateBed,
  deleteBed,
};
