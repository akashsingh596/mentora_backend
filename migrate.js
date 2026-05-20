/**
 * migrate.js — Creates all database tables
 * Usage: node migrate.js
 */
const db = require('./config/db');
require('dotenv').config();

const tables = [
  {
    name: 'users',
    sql: `CREATE TABLE IF NOT EXISTS users (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      uuid            VARCHAR(36)  NOT NULL UNIQUE,
      name            VARCHAR(100) NOT NULL,
      email           VARCHAR(150) NOT NULL UNIQUE,
      password_hash   VARCHAR(255),
      role            ENUM('super_admin','professional','user') NOT NULL DEFAULT 'user',
      status          ENUM('active','inactive','pending','suspended') NOT NULL DEFAULT 'pending',
      profile_photo   VARCHAR(255),
      last_login      DATETIME,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'professional_profiles',
    sql: `CREATE TABLE IF NOT EXISTS professional_profiles (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      user_id           INT NOT NULL UNIQUE,
      headline          VARCHAR(200),
      bio               TEXT,
      total_experience  INT,
      current_industry  VARCHAR(100),
      past_companies    TEXT,
      expertise_tags    TEXT,
      languages         VARCHAR(200) DEFAULT 'Hindi, English',
      city              VARCHAR(100),
      state             VARCHAR(100),
      linkedin_url      VARCHAR(255),
      hourly_rate       DECIMAL(10,2) NOT NULL DEFAULT 0,
      is_available      TINYINT(1) NOT NULL DEFAULT 1,
      approval_status   ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      approval_note     TEXT,
      total_sessions    INT NOT NULL DEFAULT 0,
      avg_rating        DECIMAL(3,2) NOT NULL DEFAULT 0,
      created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'user_profiles',
    sql: `CREATE TABLE IF NOT EXISTS user_profiles (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      user_id   INT NOT NULL UNIQUE,
      user_type ENUM('student','startup','sme','corporate','other') DEFAULT 'student',
      bio       TEXT,
      city      VARCHAR(100),
      state     VARCHAR(100),
      goals     TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'session_requests',
    sql: `CREATE TABLE IF NOT EXISTS session_requests (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT NOT NULL,
      professional_id INT NOT NULL,
      topic           VARCHAR(255) NOT NULL,
      message         TEXT,
      preferred_time  VARCHAR(100),
      status          ENUM('pending','confirmed','declined','completed') NOT NULL DEFAULT 'pending',
      meeting_link    VARCHAR(500),
      scheduled_at    DATETIME,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)         REFERENCES users(id),
      FOREIGN KEY (professional_id) REFERENCES professional_profiles(id)
    )`
  }
];

async function migrate() {
  console.log('🚀 Running migrations...\n');
  for (const table of tables) {
    try {
      await db.query(table.sql);
      console.log(`✅ Table ready: ${table.name}`);
    } catch (err) {
      console.error(`❌ Failed: ${table.name} — ${err.message}`);
    }
  }
  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrate();
