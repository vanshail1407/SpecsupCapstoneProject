const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'specsup_jwt_secret_key_2026_super_secure_token',
    {
      expiresIn: '30d',
    }
  );
};

module.exports = generateToken;
