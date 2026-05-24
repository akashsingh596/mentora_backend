-- ============================================================
-- MentorBridge MVP — Database Schema
-- Run in order in your MySQL client
-- ============================================================

CREATE DATABASE IF NOT EXISTS mentora_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mentora_db;

-- ── 1. Users (All roles in one table) ────────────────────────
CREATE TABLE IF NOT EXISTS users (
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
);

-- ── 2. Professional Profiles ──────────────────────────────────
CREATE TABLE IF NOT EXISTS professional_profiles (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT NOT NULL UNIQUE,
  headline              VARCHAR(200),
  bio                   TEXT,
  total_experience      INT COMMENT 'Years of experience',
  current_industry      VARCHAR(100),
  past_companies        TEXT COMMENT 'e.g. TCS, Infosys, IAS',
  expertise_tags        TEXT COMMENT 'e.g. Finance, UPSC, HR, IIT Coaching',
  languages             VARCHAR(200) DEFAULT 'Hindi, English',
  city                  VARCHAR(100),
  state                 VARCHAR(100),
  linkedin_url          VARCHAR(255),
  hourly_rate           DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_available          TINYINT(1) NOT NULL DEFAULT 1,
  approval_status       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approval_note         TEXT,
  total_sessions        INT NOT NULL DEFAULT 0,
  avg_rating            DECIMAL(3,2) NOT NULL DEFAULT 0,
  -- ── New fields for enhanced Expert Profile page ────────────
  video_intro_url       VARCHAR(500) COMMENT 'URL to intro video (YouTube embed, etc.)',
  video_intro_title     VARCHAR(255) COMMENT 'Display title for the intro video',
  video_intro_duration  VARCHAR(30)  COMMENT 'e.g. 2 min 14 sec',
  response_time         VARCHAR(100) COMMENT 'e.g. Usually responds in 2h',
  is_verified           TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = identity verified',
  verified_date         DATE         COMMENT 'Date when identity was verified',
  experience_timeline   JSON         COMMENT 'JSON array of {title, company, period, description}',
  -- ──────────────────────────────────────────────────────────
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 3. User Profiles (Students / Startups / SMEs) ────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL UNIQUE,
  user_type ENUM('student','startup','sme','corporate','other') DEFAULT 'student',
  bio       TEXT,
  city      VARCHAR(100),
  state     VARCHAR(100),
  goals     TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 4. Session Requests (Core MVP Table) ─────────────────────
CREATE TABLE IF NOT EXISTS session_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  professional_id INT NOT NULL COMMENT 'References professional_profiles.id',
  topic           VARCHAR(255) NOT NULL,
  message         TEXT,
  preferred_time  VARCHAR(100) COMMENT 'e.g. Weekday evenings, Saturday morning',
  status          ENUM('pending','confirmed','declined','completed') NOT NULL DEFAULT 'pending',
  meeting_link    VARCHAR(500) COMMENT 'Google Meet / Zoom link added by admin',
  scheduled_at    DATETIME COMMENT 'Confirmed session date & time',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)         REFERENCES users(id),
  FOREIGN KEY (professional_id) REFERENCES professional_profiles(id)
);

-- ── 5. Super Admin Seed (run once) ───────────────────────────
-- Replace the password hash below with: bcrypt.hash('Admin@1234', 12)
-- Or use the /api/auth/register endpoint with role: super_admin after seeding manually
-- INSERT INTO users (uuid, name, email, password_hash, role, status)
-- VALUES (UUID(), 'Super Admin', 'admin@mentora.in', '$2a$12$...', 'super_admin', 'active');
