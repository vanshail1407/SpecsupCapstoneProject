const Frame = require('../models/Frame');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const Reservation = require('../models/Reservation');

// ----------------- 1. Frames Management -----------------

// @desc    Get all frames for admin
// @route   GET /api/admin/frames
// @access  Private/Admin
const adminGetFrames = async (req, res, next) => {
  try {
    const frames = await Frame.find({}).sort({ createdAt: -1 });
    res.status(200).json(frames.map((f) => f.toJSON()));
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new frame
// @route   POST /api/admin/frames
// @access  Private/Admin
const adminCreateFrame = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      price,
      image_url,
      quantity,
      description,
      lens_width_mm,
      lens_height_mm,
      bridge_width_mm,
      frame_shape,
      frame_material,
      frame_status,
    } = req.body;

    if (!name || !brand || price === undefined || !image_url) {
      return res.status(400).json({
        status: 'error',
        detail: 'Name, brand, price, and image_url are required.',
        message: 'Name, brand, price, and image_url are required.',
      });
    }

    const frame = await Frame.create({
      name: name.trim(),
      brand: brand.trim(),
      price: Number(price),
      image_url: image_url.trim(),
      quantity: quantity !== undefined ? Number(quantity) : 0,
      description: description ? description.trim() : null,
      lens_width_mm: lens_width_mm !== undefined && lens_width_mm !== null && lens_width_mm !== '' ? Number(lens_width_mm) : null,
      lens_height_mm: lens_height_mm !== undefined && lens_height_mm !== null && lens_height_mm !== '' ? Number(lens_height_mm) : null,
      bridge_width_mm: bridge_width_mm !== undefined && bridge_width_mm !== null && bridge_width_mm !== '' ? Number(bridge_width_mm) : null,
      frame_shape: frame_shape ? frame_shape.trim() : null,
      frame_material: frame_material ? frame_material.trim() : null,
      frame_status: frame_status || 'active',
    });

    res.status(201).json(frame.toJSON());
  } catch (error) {
    next(error);
  }
};

// @desc    Update a frame
// @route   PUT /api/admin/frames/:id
// @access  Private/Admin
const adminUpdateFrame = async (req, res, next) => {
  try {
    const frame = await Frame.findById(req.params.id);
    if (!frame) {
      return res.status(404).json({
        status: 'error',
        detail: 'Frame not found.',
        message: 'Frame not found.',
      });
    }

    const {
      name,
      brand,
      price,
      image_url,
      quantity,
      description,
      lens_width_mm,
      lens_height_mm,
      bridge_width_mm,
      frame_shape,
      frame_material,
      frame_status,
    } = req.body;

    if (name !== undefined) frame.name = name.trim();
    if (brand !== undefined) frame.brand = brand.trim();
    if (price !== undefined) frame.price = Number(price);
    if (image_url !== undefined) frame.image_url = image_url.trim();
    if (quantity !== undefined) frame.quantity = Number(quantity);
    if (description !== undefined) frame.description = description ? description.trim() : null;
    if (lens_width_mm !== undefined) frame.lens_width_mm = lens_width_mm !== null && lens_width_mm !== '' ? Number(lens_width_mm) : null;
    if (lens_height_mm !== undefined) frame.lens_height_mm = lens_height_mm !== null && lens_height_mm !== '' ? Number(lens_height_mm) : null;
    if (bridge_width_mm !== undefined) frame.bridge_width_mm = bridge_width_mm !== null && bridge_width_mm !== '' ? Number(bridge_width_mm) : null;
    if (frame_shape !== undefined) frame.frame_shape = frame_shape ? frame_shape.trim() : null;
    if (frame_material !== undefined) frame.frame_material = frame_material ? frame_material.trim() : null;
    if (frame_status !== undefined) frame.frame_status = frame_status || 'active';

    const updated = await frame.save();
    res.status(200).json(updated.toJSON());
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a frame
// @route   DELETE /api/admin/frames/:id
// @access  Private/Admin
const adminDeleteFrame = async (req, res, next) => {
  try {
    const frame = await Frame.findById(req.params.id);
    if (!frame) {
      return res.status(404).json({
        status: 'error',
        detail: 'Frame not found.',
        message: 'Frame not found.',
      });
    }

    // Check if frame has active reservations
    const reservations = await Reservation.find({ frame: frame._id });
    if (reservations && reservations.length > 0) {
      return res.status(400).json({
        status: 'error',
        detail: 'Cannot delete this frame because active pre-bookings exist for it.',
        message: 'Cannot delete this frame because active pre-bookings exist for it.',
      });
    }

    await Frame.findByIdAndDelete(frame._id);
    res.status(200).json({
      status: 'success',
      message: 'Frame deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ----------------- 2. Customers Management -----------------

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
const adminGetCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(customers.map((c) => c.toJSON()));
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer details
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
const adminGetCustomerDetail = async (req, res, next) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-password');
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        detail: 'Customer not found.',
        message: 'Customer not found.',
      });
    }

    res.status(200).json(customer.toJSON());
  } catch (error) {
    next(error);
  }
};

// ----------------- 3. Prescriptions Operations -----------------

// @desc    Add prescription for customer
// @route   POST /api/admin/customers/:id/prescriptions
// @access  Private/Admin
const adminAddPrescription = async (req, res, next) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        detail: 'Customer not found.',
        message: 'Customer not found.',
      });
    }

    const {
      checkup_date,
      right_sph,
      right_cyl,
      right_axis,
      right_pd,
      left_sph,
      left_cyl,
      left_axis,
      left_pd,
      notes,
    } = req.body;

    const rx = await Prescription.create({
      customer: customer._id,
      checkup_date,
      right_sph: Number(right_sph),
      right_cyl: Number(right_cyl),
      right_axis: Number(right_axis),
      right_pd: Number(right_pd),
      left_sph: Number(left_sph),
      left_cyl: Number(left_cyl),
      left_axis: Number(left_axis),
      left_pd: Number(left_pd),
      notes: notes ? notes.trim() : null,
    });

    res.status(201).json(rx.toJSON());
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer prescriptions
// @route   GET /api/admin/customers/:id/prescriptions
// @access  Private/Admin
const adminGetCustomerPrescriptions = async (req, res, next) => {
  try {
    const rxList = await Prescription.find({ customer: req.params.id }).sort({
      checkup_date: -1,
      createdAt: -1,
    });

    res.status(200).json(rxList.map((r) => r.toJSON()));
  } catch (error) {
    next(error);
  }
};

// ----------------- 4. Reservations Listing -----------------

// @desc    Get all reservations
// @route   GET /api/admin/reservations
// @access  Private/Admin
const adminGetReservations = async (req, res, next) => {
  try {
    const rows = await Reservation.find({})
      .populate('frame')
      .populate('customer')
      .sort({ createdAt: -1 });

    const formatted = rows.map((r) => ({
      id: r._id.toString(),
      customer_id: r.customer ? r.customer._id.toString() : null,
      frame_id: r.frame ? r.frame._id.toString() : null,
      reservation_date: r.reservation_date
        ? r.reservation_date.toISOString().replace('T', ' ').substring(0, 19)
        : '',
      frame_name: r.frame ? r.frame.name : 'Unknown Frame',
      brand: r.frame ? r.frame.brand : '',
      price: r.frame ? r.frame.price : 0,
      image_url: r.frame ? r.frame.image_url : '',
      customer_name: r.customer ? r.customer.name : 'Unknown Customer',
      customer_email: r.customer ? r.customer.email : '',
    }));

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminGetFrames,
  adminCreateFrame,
  adminUpdateFrame,
  adminDeleteFrame,
  adminGetCustomers,
  adminGetCustomerDetail,
  adminAddPrescription,
  adminGetCustomerPrescriptions,
  adminGetReservations,
};
