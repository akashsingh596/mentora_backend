const db     = require('../config/db');
const { success, error } = require('../utils/response');
const { sendApprovalEmail, sendSessionConfirmed } = require('../services/email.service');

// ── Dashboard Stats ───────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [[{ total_users }]]         = await db.query("SELECT COUNT(*) AS total_users FROM users WHERE role = 'user'");
    const [[{ total_professionals }]] = await db.query("SELECT COUNT(*) AS total_professionals FROM users WHERE role = 'professional'");
    const [[{ pending_approvals }]]   = await db.query("SELECT COUNT(*) AS pending_approvals FROM professional_profiles WHERE approval_status = 'pending'");
    const [[{ total_requests }]]      = await db.query("SELECT COUNT(*) AS total_requests FROM session_requests");
    const [[{ pending_requests }]]    = await db.query("SELECT COUNT(*) AS pending_requests FROM session_requests WHERE status = 'pending'");

    return success(res, 'Dashboard stats', {
      total_users, total_professionals, pending_approvals, total_requests, pending_requests
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Server error', 500);
  }
};

// ── List all users ────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, uuid, name, email, role, status, created_at, last_login
      FROM users ORDER BY created_at DESC
    `);
    return success(res, 'Users fetched', { users: rows });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── Update user status (activate / suspend) ───────────────────
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return error(res, 'Invalid status', 400);
    }
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    return success(res, `User status updated to ${status}`);
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── List all professionals ─────────────────────────────────────
exports.getProfessionals = async (req, res) => {
  try {
    const { status } = req.query; // 'pending' | 'approved' | 'rejected'

    let query = `
      SELECT u.id, u.name, u.email, u.status AS user_status, u.profile_photo, u.created_at,
             pp.id AS profile_id, pp.headline, pp.expertise_tags, pp.hourly_rate,
             pp.approval_status, pp.city, pp.state, pp.total_sessions, pp.avg_rating
      FROM users u
      JOIN professional_profiles pp ON pp.user_id = u.id
      WHERE u.role = 'professional'
    `;
    const params = [];

    if (status) {
      query += ` AND pp.approval_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY u.created_at DESC`;

    const [rows] = await db.query(query, params);
    return success(res, 'Professionals fetched', { professionals: rows });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── Approve or Reject a professional ─────────────────────────
exports.updateProfessionalStatus = async (req, res) => {
  try {
    const { status, note } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return error(res, 'Status must be approved or rejected', 400);
    }

    await db.query(
      `UPDATE professional_profiles SET approval_status = ?, approval_note = ? WHERE id = ?`,
      [status, note || null, req.params.id]
    );

    // If approved, activate user and send email
    if (status === 'approved') {
      const [ppRows] = await db.query(
        'SELECT u.name, u.email FROM professional_profiles pp JOIN users u ON u.id = pp.user_id WHERE pp.id = ?',
        [req.params.id]
      );
      if (ppRows.length > 0) {
        await db.query(
          "UPDATE users SET status = 'active' WHERE id = (SELECT user_id FROM professional_profiles WHERE id = ?)",
          [req.params.id]
        );
        sendApprovalEmail({ name: ppRows[0].name, email: ppRows[0].email }).catch(console.error);
      }
    }

    return success(res, `Professional ${status}`);
  } catch (err) {
    console.error(err);
    return error(res, 'Server error', 500);
  }
};

// ── List all session requests ──────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sr.*,
             u.name  AS user_name,  u.email  AS user_email,
             pu.name AS pro_name,   pu.email AS pro_email,
             pp.headline AS pro_headline
      FROM session_requests sr
      JOIN users u   ON u.id  = sr.user_id
      JOIN professional_profiles pp ON pp.id = sr.professional_id
      JOIN users pu  ON pu.id = pp.user_id
      ORDER BY sr.created_at DESC
    `);
    return success(res, 'Sessions fetched', { sessions: rows });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── Schedule session — paste Google Meet link ─────────────────
exports.scheduleSession = async (req, res) => {
  try {
    const { meeting_link, scheduled_at } = req.body;

    if (!meeting_link) return error(res, 'Meeting link is required', 400);

    await db.query(
      `UPDATE session_requests SET meeting_link = ?, scheduled_at = ?, status = 'confirmed' WHERE id = ?`,
      [meeting_link, scheduled_at || null, req.params.id]
    );

    // Fetch session details and email both parties
    const [rows] = await db.query(`
      SELECT sr.topic, sr.scheduled_at, sr.meeting_link,
             u.name AS user_name, u.email AS user_email,
             pu.name AS pro_name, pu.email AS pro_email
      FROM session_requests sr
      JOIN users u   ON u.id  = sr.user_id
      JOIN professional_profiles pp ON pp.id = sr.professional_id
      JOIN users pu  ON pu.id = pp.user_id
      WHERE sr.id = ?
    `, [req.params.id]);

    if (rows.length > 0) {
      const s = rows[0];
      const sessionInfo = { topic: s.topic, scheduled_at: s.scheduled_at, meeting_link: s.meeting_link };

      // Email the user
      sendSessionConfirmed({
        name: s.user_name, email: s.user_email,
        professional: s.pro_name, session: sessionInfo
      }).catch(console.error);

      // Email the professional
      sendSessionConfirmed({
        name: s.pro_name, email: s.pro_email,
        professional: s.user_name, session: { ...sessionInfo, topic: `Session with ${s.user_name}: ${s.topic}` }
      }).catch(console.error);
    }

    return success(res, 'Session scheduled and both parties notified via email');
  } catch (err) {
    console.error(err);
    return error(res, 'Server error', 500);
  }
};
