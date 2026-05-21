// ═══════════════════════════════════════════════
// server.js — Entry point for Smart Expense API
// ═══════════════════════════════════════════════

// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

// Validate all required env vars before anything else
const { validateEnv } = require('./src/config/config');
validateEnv();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const { sendSuccess } = require('./src/utils/response');
const { globalErrorHandler } = require('./src/middleware/errorHandler');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ═══════════════════════════════════════════════
// MIDDLEWARE STACK
// ═══════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS — allow frontend to call this API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request logging — only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Parse incoming JSON bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Initialize Passport — required for OAuth strategies
// session: false because we use JWT, not server sessions
const passport = require('./src/config/passport');
app.use(passport.initialize());

// ═══════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';
  const isHealthy = mongoose.connection.readyState === 1;

  const memoryUsage = process.memoryUsage();
  const formatMB = (bytes) => `${Math.round(bytes / 1024 / 1024 * 100) / 100} MB`;

  sendSuccess(res, {
    status: isHealthy ? 'healthy' : 'degraded',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'not connected',
    },
    memory: {
      heapUsed: formatMB(memoryUsage.heapUsed),
      heapTotal: formatMB(memoryUsage.heapTotal),
      rss: formatMB(memoryUsage.rss),
    },
    version: '1.0.0',
  }, isHealthy ? 'Server is healthy' : 'Server is degraded');
});

// Auth routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// SSO routes
const ssoRoutes = require('./src/routes/ssoRoutes');
app.use('/api/auth', ssoRoutes);

// Expense routes
const expenseRoutes = require('./src/routes/expenseRoutes');
app.use('/api/expenses', expenseRoutes);

// Budget routes
const budgetRoutes = require('./src/routes/budgetRoutes');
app.use('/api/budgets', budgetRoutes);

// Analytics routes
const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

// Insights routes
const insightsRoutes = require('./src/routes/insightsRoutes');
app.use('/api/insights', insightsRoutes);

// Prediction routes
const predictionRoutes = require('./src/routes/predictionRoutes');
app.use('/api/predictions', predictionRoutes);

// Group routes
const groupRoutes = require('./src/routes/groupRoutes');
app.use('/api/groups', groupRoutes);

//Invite routes
const inviteRoutes = require('./src/routes/inviteRoutes');
app.use('/api', inviteRoutes);

// Public routes
const publicRoutes = require('./src/routes/publicRoutes');
app.use('/api', publicRoutes);

// ───────────────────────────────────────────────
// 404 HANDLER — catches any unmatched routes
// Must come AFTER all route definitions
// ───────────────────────────────────────────────
app.use((req, res) => {
  const { sendError } = require('./src/utils/response');
  sendError(res, `Route ${req.originalUrl} not found`, 404);
});

// ───────────────────────────────────────────────
// GLOBAL ERROR HANDLER — must be absolutely last
// ───────────────────────────────────────────────
app.use(globalErrorHandler);

// ═══════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});