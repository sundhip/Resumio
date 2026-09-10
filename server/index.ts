import express from 'express';
import cors from 'cors';
import { initDatabase } from './database/db';
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

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Security Headers & CORS
app.use(securityHeadersMiddleware);
app.use(cors({
  origin: '*',
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
initDatabase();

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

// 4. Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Resumio Enterprise Recruitment Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 5. Centralized Error Handling Middleware
app.use(centralizedErrorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Resumio Production-Ready Backend API running on http://localhost:${PORT}`);
});
