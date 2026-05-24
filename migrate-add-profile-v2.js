/**
 * migrate-add-profile-v2.js
 * Safely adds the new Expert Profile columns to professional_profiles.
 * Run ONCE on existing databases: node migrate-add-profile-v2.js
 *
 * Each ALTER TABLE uses "ADD COLUMN IF NOT EXISTS" so it is safe to re-run.
 * MySQL < 8.0 does not support IF NOT EXISTS on ALTER; we catch duplicate-column
 * errors (errno 1060) and skip them gracefully.
 */
const db = require('./config/db');
require('dotenv').config();

const alterations = [
  `ALTER TABLE professional_profiles ADD COLUMN video_intro_url      VARCHAR(500)   NULL AFTER avg_rating`,
  `ALTER TABLE professional_profiles ADD COLUMN video_intro_title    VARCHAR(255)   NULL AFTER video_intro_url`,
  `ALTER TABLE professional_profiles ADD COLUMN video_intro_duration VARCHAR(30)    NULL AFTER video_intro_title`,
  `ALTER TABLE professional_profiles ADD COLUMN response_time        VARCHAR(100)   NULL AFTER video_intro_duration`,
  `ALTER TABLE professional_profiles ADD COLUMN is_verified          TINYINT(1) NOT NULL DEFAULT 0 AFTER response_time`,
  `ALTER TABLE professional_profiles ADD COLUMN verified_date        DATE           NULL AFTER is_verified`,
  `ALTER TABLE professional_profiles ADD COLUMN experience_timeline  JSON           NULL AFTER verified_date`,
];

async function run() {
  console.log('🚀  Running Expert Profile v2 migration...\n');
  for (const sql of alterations) {
    const col = sql.match(/ADD COLUMN (\w+)/)?.[1] ?? sql;
    try {
      await db.query(sql);
      console.log(`  ✅  Added column: ${col}`);
    } catch (err) {
      if (err.errno === 1060) {
        console.log(`  ⚠️   Column already exists (skipped): ${col}`);
      } else {
        console.error(`  ❌  Failed: ${col} — ${err.message}`);
      }
    }
  }
  console.log('\n✅  Migration complete!');
}

module.exports = run;
