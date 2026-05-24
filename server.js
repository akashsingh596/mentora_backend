const app = require('./app');
require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const runMigrations = require('./migrate-add-profile-v2');

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 MentorBridge API running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('Migration error:', err);
    // Start server anyway if migration fails
    app.listen(PORT, () => {
      console.log(`🚀 MentorBridge API running on port ${PORT}`);
    });
  });
