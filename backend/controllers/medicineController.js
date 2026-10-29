const Medicine = require('../models/Medicine');

// @desc    Get all medicines with search, category, pagination, stock filters
// @route   GET /api/medicines
// @access  Private (Pharmacy, Admin, Doctor)
const getMedicines = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status = 'ACTIVE',
      filter, // 'low-stock', 'expiring', 'expired'
      page = 1,
      limit = 10,
      sort = 'name',
    } = req.query;

    const query = {};

    if (status !== 'ALL') {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (filter === 'low-stock') {
      query.$expr = { $lte: ['$stock', '$minimumStock'] };
    } else if (filter === 'expiring') {
      query.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
    } else if (filter === 'expired') {
      query.expiryDate = { $lt: now };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: medicines,
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

// @desc    Get smart medicine alerts (Smart Feature 3)
// @route   GET /api/medicines/alerts/all
// @access  Private (Pharmacy, Admin)
const getMedicineAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Low stock medicines (stock <= minimumStock)
    const lowStock = await Medicine.find({
      status: 'ACTIVE',
      $expr: { $lte: ['$stock', '$minimumStock'] },
    }).sort('stock');

    // 2. Expiring soon medicines (within 30 days)
    const expiringSoon = await Medicine.find({
      status: 'ACTIVE',
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
    }).sort('expiryDate');

    // 3. Expired medicines
    const expired = await Medicine.find({
      status: 'ACTIVE',
      expiryDate: { $lt: now },
    }).sort('expiryDate');

    res.status(200).json({
      success: true,
      data: {
        lowStock: {
          count: lowStock.length,
          items: lowStock,
        },
        expiringSoon: {
          count: expiringSoon.length,
          items: expiringSoon,
        },
        expired: {
          count: expired.length,
          items: expired,
        },
        totalAlerts: lowStock.length + expiringSoon.length + expired.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medicine
// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new medicine
// @route   POST /api/medicines
// @access  Private (Pharmacy, Admin)
const createMedicine = async (req, res, next) => {
  try {
    const {
      name,
      category,
      manufacturer,
      batchNumber,
      price,
      stock,
      minimumStock,
      expiryDate,
      description,
    } = req.body;

    if (!name || !category || !batchNumber || price === undefined || stock === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required medicine fields',
      });
    }

    const medicine = await Medicine.create({
      name,
      category,
      manufacturer: manufacturer || '',
      batchNumber,
      price: Number(price),
      stock: Number(stock),
      minimumStock: minimumStock !== undefined ? Number(minimumStock) : 10,
      expiryDate,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added to inventory successfully',
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private (Pharmacy, Admin)
const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock specifically
// @route   PUT /api/medicines/:id/stock
// @access  Private (Pharmacy, Admin)
const updateStock = async (req, res, next) => {
  try {
    const { adjustment, newStock } = req.body;
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    if (newStock !== undefined) {
      medicine.stock = Math.max(0, Number(newStock));
    } else if (adjustment !== undefined) {
      const calculated = medicine.stock + Number(adjustment);
      if (calculated < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock. Quantity cannot be negative.',
        });
      }
      medicine.stock = calculated;
    }

    await medicine.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private (Pharmacy, Admin)
const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    await Medicine.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedicines,
  getMedicineAlerts,
  getMedicineById,
  createMedicine,
  updateMedicine,
  updateStock,
  deleteMedicine,
};
