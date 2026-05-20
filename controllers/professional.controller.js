const db     = require('../config/db');
const { success, error } = require('../utils/response');

// ── PUBLIC: List all approved professionals ───────────────────
exports.listProfessionals = async (req, res) => {
  try {
    const { search, expertise } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, u.profile_photo,
             pp.id AS profile_id, pp.headline, pp.bio, pp.expertise_tags,
             pp.current_industry, pp.city, pp.state, pp.hourly_rate,
             pp.total_sessions, pp.avg_rating, pp.languages
      FROM users u
      JOIN professional_profiles pp ON pp.user_id = u.id
      WHERE u.role = 'professional' AND u.status = 'active' AND pp.approval_status = 'approved'
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR pp.headline LIKE ? OR pp.expertise_tags LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (expertise) {
      query += ` AND pp.expertise_tags LIKE ?`;
      params.push(`%${expertise}%`);
    }

    query += ` ORDER BY pp.avg_rating DESC, pp.total_sessions DESC`;

    const [rows] = await db.query(query, params);
    return success(res, 'Professionals fetched', { professionals: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    return error(res, 'Server error', 500);
  }
};

// ── PUBLIC: Get one professional by user id ───────────────────
exports.getProfessional = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.profile_photo,
             pp.id AS profile_id, pp.headline, pp.bio, pp.expertise_tags,
             pp.current_industry, pp.past_companies, pp.total_experience,
             pp.city, pp.state, pp.linkedin_url, pp.hourly_rate,
             pp.total_sessions, pp.avg_rating, pp.languages, pp.is_available
      FROM users u
      JOIN professional_profiles pp ON pp.user_id = u.id
      WHERE u.id = ? AND u.role = 'professional' AND pp.approval_status = 'approved'
    `, [req.params.id]);

    if (rows.length === 0) return error(res, 'Professional not found', 404);
    return success(res, 'Professional fetched', { professional: rows[0] });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── PROFESSIONAL: Get own profile ─────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.profile_photo,
             pp.*, pp.id AS profile_id
      FROM users u
      JOIN professional_profiles pp ON pp.user_id = u.id
      WHERE u.id = ?
    `, [req.user.id]);

    if (rows.length === 0) return error(res, 'Profile not found', 404);
    return success(res, 'Profile fetched', { profile: rows[0] });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};

// ── PROFESSIONAL: Update own profile ──────────────────────────
exports.updateMyProfile = async (req, res) => {
  try {
    const {
      headline, bio, total_experience, current_industry,
      past_companies, expertise_tags, languages, city, state,
      linkedin_url, hourly_rate, is_available
    } = req.body;

    await db.query(`
      UPDATE professional_profiles SET
        headline = COALESCE(?, headline),
        bio = COALESCE(?, bio),
        total_experience = COALESCE(?, total_experience),
        current_industry = COALESCE(?, current_industry),
        past_companies = COALESCE(?, past_companies),
        expertise_tags = COALESCE(?, expertise_tags),
        languages = COALESCE(?, languages),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        linkedin_url = COALESCE(?, linkedin_url),
        hourly_rate = COALESCE(?, hourly_rate),
        is_available = COALESCE(?, is_available)
      WHERE user_id = ?
    `, [
      headline, bio, total_experience, current_industry,
      past_companies, expertise_tags, languages, city, state,
      linkedin_url, hourly_rate, is_available,
      req.user.id
    ]);

    return success(res, 'Profile updated successfully');
  } catch (err) {
    console.error(err);
    return error(res, 'Server error', 500);
  }
};

// ── PROFESSIONAL: Upload profile photo ────────────────────────
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const photoPath = `/${req.file.path.replace(/\\/g, '/')}`;
    await db.query('UPDATE users SET profile_photo = ? WHERE id = ?', [photoPath, req.user.id]);

    return success(res, 'Photo uploaded', { photo_url: photoPath });
  } catch (err) {
    return error(res, 'Server error', 500);
  }
};
