const Bill = require('../models/Bill');
const { createNotification } = require('../utils/notificationHelper');

// Helper to calculate totals
const calculateTotals = (items = [], tax = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const taxAmount = Number(tax) || 0;
  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);
  return { subtotal, total };
};

// @desc    Create a new bill
// @route   POST /api/bills
// @access  Private (Admin)
const createBill = async (req, res, next) => {
  try {
    const { patient, appointment, admission, items, tax = 0, discount = 0, paymentStatus = 'PENDING', paymentMethod } = req.body;

    if (!patient || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient and at least one bill item are required',
      });
    }

    const calculatedItems = items.map((item) => ({
      description: item.description,
      category: item.category || 'OTHER',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.price) || 0),
    }));

    const { subtotal, total } = calculateTotals(calculatedItems, tax, discount);

    const bill = await Bill.create({
      patient,
      appointment: appointment || null,
      admission: admission || null,
      items: calculatedItems,
      subtotal,
      tax: Number(tax) || 0,
      discount: Number(discount) || 0,
      total,
      paymentStatus,
      paymentMethod: paymentMethod || 'CASH',
      paidAt: paymentStatus === 'PAID' ? new Date() : null,
    });

    const populated = await Bill.findById(bill._id)
      .populate('patient', 'name email phone gender address')
      .populate('appointment')
      .populate('admission');

    await createNotification({
      userId: patient,
      title: 'Invoice Generated',
      message: `A hospital bill (#${bill._id.toString().slice(-6).toUpperCase()}) for $${total} has been issued.`,
      type: 'BILL',
      link: '/patient/bills',
    });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bills with filters & pagination
// @route   GET /api/bills
// @access  Private (Admin, Patient)
const getBills = async (req, res, next) => {
  try {
    const { paymentStatus, patient, page = 1, limit = 10, search } = req.query;
    const query = {};

    if (req.user.role === 'PATIENT') {
      query.patient = req.user._id;
    } else if (patient) {
      query.patient = patient;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus.toUpperCase();
    }

    if (search) {
      query['items.description'] = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .populate('patient', 'name email phone gender')
      .populate('appointment')
      .populate('admission')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: bills,
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

// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private (Admin, Patient)
const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient', 'name email phone gender address bloodGroup dateOfBirth')
      .populate({
        path: 'appointment',
        populate: [{ path: 'doctor', select: 'name specialization' }, { path: 'department', select: 'name' }],
      })
      .populate({
        path: 'admission',
        populate: [{ path: 'bed', select: 'bedNumber ward' }, { path: 'doctor', select: 'name' }],
      });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    if (
      req.user.role === 'PATIENT' &&
      bill.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bill details
// @route   PUT /api/bills/:id
// @access  Private/Admin
const updateBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    const { items, tax, discount, paymentStatus, paymentMethod } = req.body;

    if (items && Array.isArray(items)) {
      bill.items = items.map((item) => ({
        description: item.description,
        category: item.category || 'OTHER',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.price) || 0),
      }));
    }

    if (tax !== undefined) bill.tax = Number(tax);
    if (discount !== undefined) bill.discount = Number(discount);

    const { subtotal, total } = calculateTotals(bill.items, bill.tax, bill.discount);
    bill.subtotal = subtotal;
    bill.total = total;

    if (paymentStatus) {
      bill.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID' && !bill.paidAt) {
        bill.paidAt = new Date();
      }
    }

    if (paymentMethod) {
      bill.paymentMethod = paymentMethod;
    }

    const updated = await bill.save();
    const populated = await Bill.findById(updated._id).populate('patient', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process demo payment for a bill
// @route   PUT /api/bills/:id/payment
// @access  Private (Admin, Patient)
const processPayment = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    if (
      req.user.role === 'PATIENT' &&
      bill.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    const { paymentMethod = 'DEMO_PAY' } = req.body;

    bill.paymentStatus = 'PAID';
    bill.paymentMethod = paymentMethod;
    bill.paidAt = new Date();

    const updated = await bill.save();
    const populated = await Bill.findById(updated._id).populate('patient', 'name email phone');

    await createNotification({
      userId: bill.patient,
      title: 'Payment Successful',
      message: `Your payment of $${bill.total} for invoice #${bill._id.toString().slice(-6).toUpperCase()} has been confirmed. Thank you!`,
      type: 'BILL',
      link: '/patient/bills',
    });

    res.status(200).json({
      success: true,
      message: 'Demo payment processed successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  processPayment,
};
