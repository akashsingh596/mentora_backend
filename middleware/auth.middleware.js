const { verifyToken } = require('../config/jwt');
const db = require('../config/db');
const { error } = require('../utils/response');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const [rows] = await db.query(
      'SELECT id, uuid, name, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) return error(res, 'User not found', 401);
    if (rows[0].status === 'suspended') return error(res, 'Account suspended', 403);

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired. Please login again.', 401);
    }
    return error(res, 'Invalid token', 401);
  }
};
