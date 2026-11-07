const User = require('../models/User');

// @desc    Get customer profile
// @route   GET /api/customers/me
// @access  Private
const getMyProfile = async (req, res) => {
  res.status(200).json(req.user.toJSON());
};

// @desc    Update customer profile
// @route   PUT /api/customers/me
// @access  Private
const updateMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        detail: 'Customer not found.',
        message: 'Customer not found.',
      });
    }

    const { name, phone, dob, address } = req.body;
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (dob !== undefined) user.dob = dob ? dob.trim() : null;
    if (address !== undefined) user.address = address ? address.trim() : null;

    const updated = await user.save();
    res.status(200).json(updated.toJSON());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};
