require('./config/env'); // validate env vars on startup

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/jobs.routes');
const jobseekerRoutes = require('./routes/jobseekers.routes');
const employerRoutes = require('./routes/employers.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // allow cookies to be sent cross-origin
}));

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// General rate limiter (applied to all /api routes)
// ---------------------------------------------------------------------------
app.use('/api', generalLimiter);

// ---------------------------------------------------------------------------
// Health check (no auth, no rate limit)
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Mahee Nexus API is running' });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/admin', adminRoutes);

// ---------------------------------------------------------------------------
// 404 handler — catches any unmatched route
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---------------------------------------------------------------------------
// Centralized error handler — must be last
// ---------------------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
