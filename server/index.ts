import express from 'express';
import cors from 'cors';
import { initDatabase } from './database/db';
import { initMongoDatabase, checkMongoReadiness } from './database/mongo';
import { securityHeadersMiddleware, createRateLimiter, centralizedErrorHandler } from './middleware/security';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import adminRouter from './routes/admin';
import candidateRouter from './routes/candidate';
import jobsRouter from './routes/jobs';
import { applicationsRouter } from './routes/applications';
import { resumeProcessingRouter } from './routes/resumeProcessing';
import { matchingRouter } from './routes/matching';
import { interviewsRouter } from './routes/interviews';
import { notificationsRouter } from './routes/notifications';
import { dashboardsRouter } from './routes/dashboards';
import { analyticsRouter } from './routes/analytics';
import aiIntelligenceRouter from './routes/aiIntelligence';
import { researchRouter } from './routes/researchRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Environment Variable & CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(securityHeadersMiddleware);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or development/allowed origins
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} not permitted.`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// 2. Rate Limiting for Sensitive Endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many authentication attempts. Please try again in a few minutes.',
});

const aiLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 120,
  message: 'AI processing rate limit reached. Please wait a moment before trying again.',
});

// Initialize SQLite database schema and seeds
await initDatabase();

// Initialize MongoDB database connection and models
await initMongoDatabase();

// 3. Route Mounts
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);
app.use('/api/candidate', candidateRouter);
app.use('/api', jobsRouter);
app.use('/api', applicationsRouter);
app.use('/api', resumeProcessingRouter);
app.use('/api', matchingRouter);
app.use('/api', interviewsRouter);
app.use('/api', notificationsRouter);
app.use('/api', dashboardsRouter);
app.use('/api', analyticsRouter);
app.use('/api', aiLimiter, aiIntelligenceRouter);
app.use('/api', researchRouter);

// 4. Health & Readiness Endpoints
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Resumio Enterprise Recruitment Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get(['/ready', '/api/ready'], async (_req, res) => {
  try {
    const readiness = await checkMongoReadiness();
    if (readiness.ready) {
      res.status(200).json(readiness);
    } else {
      res.status(503).json(readiness);
    }
  } catch {
    res.status(503).json({
      ready: false,
      status: 'error',
      message: 'Service readiness check failed',
    });
  }
});

// 5. Centralized Error Handling Middleware
app.use(centralizedErrorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Resumio Production-Ready Backend API running on http://localhost:${PORT}`);
});

// 6. Graceful Shutdown Handlers
const handleShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down Resumio server gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      const mongoose = (await import('mongoose')).default;
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      }
    } catch (e) {}
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
