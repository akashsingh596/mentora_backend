const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
// Note: These will be uncommented as we create the routes in the future steps.
// app.use('/api/auth',          require('./routes/auth.routes'));
// app.use('/api/admin',         require('./routes/admin.routes'));
// app.use('/api/professionals', require('./routes/professional.routes'));
// app.use('/api/users',         require('./routes/user.routes'));
// app.use('/api/bookings',      require('./routes/booking.routes'));
// app.use('/api/payments',      require('./routes/payment.routes'));
// app.use('/api/sessions',      require('./routes/session.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', app: process.env.APP_NAME, time: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

module.exports = app;
