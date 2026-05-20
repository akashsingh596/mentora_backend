const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const { generateToken } = require('../config/jwt');
const { success, error } = require('../utils/response');
const { sendWelcomeEmail } = require('../services/email.service');

// ── REGISTER ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email and password are required', 400);
    }

    // Check duplicate
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return error(res, 'Email already registered', 409);
    }

    const allowedRoles = ['user', 'professional'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(password, salt);
    const uuid = uuidv4();

    const [result] = await db.query(
      `INSERT INTO users (uuid, name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid, name, email, password_hash, userRole, userRole === 'professional' ? 'pending' : 'active']
    );

    const userId = result.insertId;

    // Create profile row
    if (userRole === 'professional') {
      await db.query('INSERT INTO professional_profiles (user_id) VALUES (?)', [userId]);
    } else {
      await db.query('INSERT INTO user_profiles (user_id) VALUES (?)', [userId]);
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ name, email, role: userRole }).catch(console.error);

    const token = generateToken({ id: userId, uuid, role: userRole });

    return success(res, 'Registration successful', {
      token,
      user: { id: userId, uuid, name, email, role: userRole }
    }, 201);

  } catch (err) {
    console.error('Register Error:', err);
    return error(res, 'Server error', 500);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return error(res, 'Invalid email or password', 401);
    }

    const user = rows[0];
    if (user.status === 'suspended') {
      return error(res, 'Account suspended. Contact support.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = generateToken({ id: user.id, uuid: user.uuid, role: user.role });

    return success(res, 'Login successful', {
      token,
      user: { id: user.id, uuid: user.uuid, name: user.name, email: user.email, role: user.role, status: user.status }
    });

  } catch (err) {
    console.error('Login Error:', err);
    return error(res, 'Server error', 500);
  }
};

// ── GET ME ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    return success(res, 'User fetched', { user: req.user });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};
