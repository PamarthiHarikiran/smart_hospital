const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_jwt_secret_hospital_management_2026',
    {
      expiresIn: '7d',
    }
  );
};

module.exports = generateToken;
