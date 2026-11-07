const Reservation = require('../models/Reservation');
const Frame = require('../models/Frame');

// @desc    Pre-book a frame with atomic stock decrement
// @route   POST /api/reservations
// @access  Private
const prebookFrame = async (req, res, next) => {
  try {
    const frameId = req.body.frame_id || req.body.frameId;

    if (!frameId) {
      return res.status(400).json({
        status: 'error',
        detail: 'Frame ID is required to pre-book.',
        message: 'Frame ID is required to pre-book.',
      });
    }

    // Atomic update: only decrement if quantity > 0
    const updatedFrame = await Frame.findOneAndUpdate(
      { _id: frameId, quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } },
      { new: true }
    );

    if (!updatedFrame) {
      const existingFrame = await Frame.findById(frameId);
      if (!existingFrame) {
        return res.status(404).json({
          status: 'error',
          detail: 'Frame not found in catalog.',
          message: 'Frame not found in catalog.',
        });
      }
      return res.status(400).json({
        status: 'error',
        detail: 'This frame is currently out of stock.',
        message: 'This frame is currently out of stock.',
      });
    }

    const reservation = await Reservation.create({
      customer: req.user._id,
      frame: updatedFrame._id,
      reservation_date: new Date(),
    });

    res.status(200).json({
      id: reservation._id.toString(),
      customer_id: req.user._id.toString(),
      frame_id: updatedFrame._id.toString(),
      reservation_date: reservation.reservation_date
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19),
      frame_name: updatedFrame.name,
      brand: updatedFrame.brand,
      price: updatedFrame.price,
      image_url: updatedFrame.image_url,
      customer_name: req.user.name,
      customer_email: req.user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in customer's reservations
// @route   GET /api/reservations/me
// @access  Private
const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customer: req.user._id })
      .populate('frame')
      .sort({ createdAt: -1 });

    const formatted = reservations.map((r) => ({
      id: r._id.toString(),
      customer_id: req.user._id.toString(),
      frame_id: r.frame ? r.frame._id.toString() : null,
      reservation_date: r.reservation_date
        ? r.reservation_date.toISOString().replace('T', ' ').substring(0, 19)
        : '',
      frame_name: r.frame ? r.frame.name : 'Unknown Frame',
      brand: r.frame ? r.frame.brand : '',
      price: r.frame ? r.frame.price : 0,
      image_url: r.frame ? r.frame.image_url : '',
      customer_name: req.user.name,
      customer_email: req.user.email,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  prebookFrame,
  getMyReservations,
};
