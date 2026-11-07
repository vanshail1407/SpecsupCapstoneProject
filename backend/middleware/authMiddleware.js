const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1].trim();

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'specsup_jwt_secret_key_2026_super_secure_token'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          status: 'error',
          detail: 'Invalid or expired session. User not found.',
          message: 'Invalid or expired session. User not found.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        detail: 'Invalid or expired session. Please log in again.',
        message: 'Invalid or expired session. Please log in again.',
      });
    }
  }

  return res.status(401).json({
    status: 'error',
    detail: 'Authentication token required. Please log in.',
    message: 'Authentication token required. Please log in.',
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    status: 'error',
    detail: 'Access denied. Admin privileges required.',
    message: 'Access denied. Admin privileges required.',
  });
};

module.exports = { protect, requireAdmin };
