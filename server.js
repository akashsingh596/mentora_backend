const app = require('./app');
require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 MentorBridge API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
