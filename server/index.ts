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
import { skillsRouter } from './routes/skills';
import { resumeOptimizerRouter } from './routes/resumeOptimizer';
import { recruiterWorkspaceRouter } from './routes/recruiterWorkspace';
import { candidateExperienceRouter } from './routes/candidateExperience';

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
app.use('/api/skills', skillsRouter);
app.use('/api/optimizer', resumeOptimizerRouter);
app.use('/api/recruiter-workspace', recruiterWorkspaceRouter);
app.use('/api/candidate-experience', candidateExperienceRouter);

// 3.1 Real-Time Server-Sent Events (SSE) Event Stream & Presence Collaboration
app.get('/api/events/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  const { jobQueue } = await import('./services/distributedJobQueue');
  const { realtimeEventBus } = await import('./services/realtimeEventBus');

  const onProgress = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'job:progress', ...data })}\n\n`);
  };
  const onCompleted = (job: any) => {
    res.write(`data: ${JSON.stringify({ type: 'job:completed', id: job.id, queue: job.queueName })}\n\n`);
  };
  const onBroadcast = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  jobQueue.on('job:progress', onProgress);
  jobQueue.on('job:completed', onCompleted);
  realtimeEventBus.on('broadcast', onBroadcast);

  const keepAliveTimer = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveTimer);
    jobQueue.off('job:progress', onProgress);
    jobQueue.off('job:completed', onCompleted);
    realtimeEventBus.off('broadcast', onBroadcast);
    res.end();
  });
});

// 3.2 Recruiter Presence & Collision Detection Endpoints
app.post('/api/presence/touch', async (req, res) => {
  const { candidateId, user } = req.body;
  if (!candidateId || !user?.userId) {
    return res.status(400).json({ error: 'candidateId and user.userId are required' });
  }
  const { realtimeEventBus } = await import('./services/realtimeEventBus');
  const presence = realtimeEventBus.touchPresence(candidateId, user);
  return res.json({ success: true, presence });
});

app.post('/api/presence/leave', async (req, res) => {
  const { candidateId, userId } = req.body;
  if (!candidateId || !userId) {
    return res.status(400).json({ error: 'candidateId and userId are required' });
  }
  const { realtimeEventBus } = await import('./services/realtimeEventBus');
  const presence = realtimeEventBus.leavePresence(candidateId, userId);
  return res.json({ success: true, presence });
});

app.get('/api/presence/:candidateId', async (req, res) => {
  const { candidateId } = req.params;
  const { realtimeEventBus } = await import('./services/realtimeEventBus');
  const presence = realtimeEventBus.getPresence(candidateId);
  return res.json({ success: true, presence });
});

// 3.3 EEOC / GDPR Blind Hiring Anonymization Shield Endpoint
app.post('/api/compliance/anonymize', async (req, res) => {
  const { candidate } = req.body;
  if (!candidate || !candidate.id) {
    return res.status(400).json({ error: 'Candidate object with id is required' });
  }
  const { ComplianceAnonymizationShield } = await import('./services/complianceAnonymizationShield');
  const anonymized = ComplianceAnonymizationShield.anonymizeCandidate(candidate);
  return res.json({ success: true, data: anonymized });
});



// 4. SRE Health, Liveness (/healthz), Readiness (/readyz), & Circuit Breakers
app.get(['/health', '/healthz', '/api/health'], async (_req, res) => {
  const { cacheService } = await import('./services/cacheService');
  const { jobQueue } = await import('./services/distributedJobQueue');
  const { resilience } = await import('./services/resilienceService');

  // If node is currently draining for Blue-Green switch, report 503 so load balancers stop routing
  if (resilience.getIsDraining()) {
    return res.status(503).json({
      status: 'draining',
      message: 'Node is draining traffic for blue-green deployment rollover',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }

  res.json({
    status: 'ok',
    service: 'Resumio Enterprise Recruitment Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    cacheStats: cacheService.getStats(),
    queueStats: {
      resumeProcessing: jobQueue.getQueueStats('resume-processing'),
    },
    circuitBreakers: resilience.getAllBreakerStats(),
    timestamp: new Date().toISOString(),
  });
});

app.get(['/ready', '/readyz', '/api/ready'], async (_req, res) => {
  const { resilience } = await import('./services/resilienceService');
  if (resilience.getIsDraining()) {
    return res.status(503).json({
      ready: false,
      status: 'draining',
      message: 'Pod is undergoing graceful drainage',
    });
  }

  try {
    const readiness = await checkMongoReadiness();
    const dbBreaker = resilience.getBreaker('database');
    const isDbCircuitOpen = dbBreaker.getState() === 'OPEN';

    if (readiness.ready && !isDbCircuitOpen) {
      res.status(200).json({
        ready: true,
        status: 'healthy',
        components: {
          mongo: readiness,
          circuitBreakers: resilience.getAllBreakerStats(),
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        status: 'degraded',
        message: isDbCircuitOpen ? 'Database circuit breaker is currently OPEN' : 'Mongo readiness failed',
        components: {
          mongo: readiness,
          circuitBreakers: resilience.getAllBreakerStats(),
        },
      });
    }
  } catch (err: any) {
    res.status(503).json({
      ready: false,
      status: 'error',
      message: err?.message || 'Service readiness check failed',
    });
  }
});

// 4.1 Chaos Engineering & SRE Diagnostics Controls
app.post('/api/admin/chaos/inject', async (req, res) => {
  const { rule } = req.body;
  if (!rule || !rule.target || !rule.type) {
    return res.status(400).json({ error: 'rule with target and type is required' });
  }
  const { resilience } = await import('./services/resilienceService');
  resilience.injectChaosRule(rule);
  return res.json({ success: true, activeRules: resilience.getActiveChaosRules() });
});

app.post('/api/admin/chaos/clear', async (_req, res) => {
  const { resilience } = await import('./services/resilienceService');
  resilience.clearChaosRules();
  return res.json({ success: true, activeRules: [] });
});

app.post('/api/admin/sre/drain', async (req, res) => {
  const { draining } = req.body;
  const { resilience } = await import('./services/resilienceService');
  resilience.setDraining(Boolean(draining));
  return res.json({ success: true, isDraining: resilience.getIsDraining() });
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
