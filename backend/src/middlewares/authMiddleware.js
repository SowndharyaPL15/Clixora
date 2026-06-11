const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, token missing',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Verify user still exists in database
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [decoded.id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists. Please register again.',
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, token invalid or expired',
    });
  }
};

module.exports = { protect };
