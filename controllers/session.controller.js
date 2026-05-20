const db     = require('../config/db');
const { success, error } = require('../utils/response');
const {
  notifyAdminNewRequest,
  sendRequestConfirmation,
  sendSessionConfirmed
} = require('../services/email.service');

// ── USER: Create session request ──────────────────────────────
exports.createRequest = async (req, res) => {
  try {
    const { professional_id, topic, message, preferred_time } = req.body;

    if (!professional_id || !topic) {
      return error(res, 'Professional ID and topic are required', 400);
    }

    // Verify the professional exists and is approved
    const [proRows] = await db.query(`
      SELECT u.id, u.name, u.email, pp.id AS profile_id
      FROM users u
      JOIN professional_profiles pp ON pp.user_id = u.id
      WHERE u.id = ? AND pp.approval_status = 'approved'
    `, [professional_id]);

    if (proRows.length === 0) return error(res, 'Professional not found', 404);

    const professional = proRows[0];

    const [result] = await db.query(`
      INSERT INTO session_requests (user_id, professional_id, topic, message, preferred_time)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, professional.profile_id, topic, message || null, preferred_time || null]);

    const sessionId = result.insertId;

    // Notify admin + user (non-blocking)
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const sessionData = { id: sessionId, topic, message, preferred_time };

    notifyAdminNewRequest({
      adminEmail,
      user: req.user,
      professional: { name: professional.name, email: professional.email },
      session: sessionData
    }).catch(console.error);

    sendRequestConfirmation({
      name: req.user.name,
      email: req.user.email,
      professional: { name: professional.name },
      session: sessionData
    }).catch(console.error);

    return success(res, 'Session request sent successfully', { request_id: sessionId }, 201);
  } catch (err) {
    console.error(err);
    return error(res, 'Server error', 500);
  }
};

// ── USER: Get own session requests ────────────────────────────
exports.myRequests = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sr.*, u.name AS professional_name, u.profile_photo AS professional_photo,
             pp.headline AS professional_headline
      FROM session_requests sr
      JOIN professional_profiles pp ON pp.id = sr.professional_id
      JOIN users u ON u.id = pp.user_id
      WHERE sr.user_id = ?
      ORDER BY sr.created_at DESC
    `, [req.user.id]);

    return success(res, 'Requests fetched', { requests: rows });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── PROFESSIONAL: Get incoming requests ───────────────────────
exports.incomingRequests = async (req, res) => {
  try {
    const [ppRows] = await db.query(
      'SELECT id FROM professional_profiles WHERE user_id = ?', [req.user.id]
    );
    if (ppRows.length === 0) return error(res, 'Profile not found', 404);

    const [rows] = await db.query(`
      SELECT sr.*, u.name AS user_name, u.email AS user_email, u.profile_photo AS user_photo
      FROM session_requests sr
      JOIN users u ON u.id = sr.user_id
      WHERE sr.professional_id = ?
      ORDER BY sr.created_at DESC
    `, [ppRows[0].id]);

    return success(res, 'Requests fetched', { requests: rows });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── PROFESSIONAL: Confirm or Decline a request ────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'confirmed' or 'declined'

    if (!['confirmed', 'declined'].includes(status)) {
      return error(res, 'Status must be confirmed or declined', 400);
    }

    const [ppRows] = await db.query(
      'SELECT id FROM professional_profiles WHERE user_id = ?', [req.user.id]
    );
    if (ppRows.length === 0) return error(res, 'Profile not found', 404);

    await db.query(
      'UPDATE session_requests SET status = ? WHERE id = ? AND professional_id = ?',
      [status, req.params.id, ppRows[0].id]
    );

    return success(res, `Request ${status}`);
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};
