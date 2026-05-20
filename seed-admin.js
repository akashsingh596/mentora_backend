/**
 * seed-admin.js
 * Run once to create the super admin account.
 * Usage: node seed-admin.js
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./config/db');
require('dotenv').config();

async function seedAdmin() {
  try {
    const name     = process.env.SUPER_ADMIN_NAME  || 'Super Admin';
    const email    = process.env.SUPER_ADMIN_EMAIL || 'admin@mentora.in';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@1234';

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('⚠️  Admin already exists:', email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    const uuid = uuidv4();

    await db.query(
      `INSERT INTO users (uuid, name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'super_admin', 'active')`,
      [uuid, name, email, password_hash]
    );

    console.log('✅ Super Admin created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  Change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seedAdmin();
