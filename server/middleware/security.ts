import { Request, Response, NextFunction } from 'express';

// ============================================================
// 1. SECURITY HEADERS MIDDLEWARE
// ============================================================

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking via frame embedding
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Enable XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content security policy for secure API communication
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  next();
}

// ============================================================
// 2. IN-MEMORY RATE LIMITING MIDDLEWARE
// ============================================================

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitBuckets = new Map<string, RateLimitStore>();

export function createRateLimiter(options: {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const { windowMs, maxRequests, message = 'Too many requests. Please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate key based on IP and/or user identifier
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-client';
    const userId = (req as any).user?.id || '';
    const key = `${req.baseUrl || ''}${req.path}:${clientIp}:${userId}`;

    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || now > bucket.resetTime) {
      rateLimitBuckets.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((bucket.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: retryAfterSeconds,
        },
      });
      return;
    }

    next();
  };
}

// Clean up expired rate limit buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now > bucket.resetTime) {
      rateLimitBuckets.delete(key);
    }
  }
}, 60000);

// ============================================================
// 3. STRUCTURED CENTRALIZED ERROR HANDLER
// ============================================================

export function centralizedErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 401 ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR'),
      message: err.message || 'An unexpected error occurred. Please try again.',
      ...(isProd ? {} : { stack: err.stack }),
    },
  });
}
