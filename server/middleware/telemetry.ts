import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface ProblemDetailsOptions {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

export class ProblemDetailsError extends Error {
  public problem: ProblemDetailsOptions;

  constructor(options: ProblemDetailsOptions) {
    super(options.detail);
    this.name = 'ProblemDetailsError';
    this.problem = options;
  }
}

/**
 * PII Redaction Masking for Structured Logging
 * Never logs raw emails, JWT bearer tokens, or sensitive resume blocks.
 */
export function redactPII(input: any): any {
  if (!input) return input;
  if (typeof input === 'string') {
    return input
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, 'Bearer [REDACTED_TOKEN]');
  }
  if (Array.isArray(input)) {
    return input.map(redactPII);
  }
  if (typeof input === 'object') {
    const output: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      if (['password', 'token', 'refreshToken', 'credential', 'raw_text'].includes(k)) {
        output[k] = '[REDACTED]';
      } else {
        output[k] = redactPII(v);
      }
    }
    return output;
  }
  return input;
}

/**
 * Request ID & Structured Logging Middleware
 */
export function requestTelemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = reqId;
  res.setHeader('x-request-id', reqId);

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logEntry = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId: reqId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
    };
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}

/**
 * RFC 9457 Problem+JSON Standardized Error Handler
 */
export function rfc9457ErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || req.get('x-request-id');
  const instance = req.originalUrl || req.url;

  if (err instanceof ProblemDetailsError) {
    const status = err.problem.status;
    res.setHeader('Content-Type', 'application/problem+json');
    return res.status(status).json({
      type: err.problem.type || 'about:blank',
      title: err.problem.title,
      status,
      detail: err.problem.detail,
      instance,
      code: err.problem.code,
      invalidParams: err.problem.invalidParams,
      requestId: reqId,
    });
  }

  // Handle generic / unexpected exceptions
  const status = typeof err.status === 'number' && err.status >= 400 ? err.status : 500;
  res.setHeader('Content-Type', 'application/problem+json');
  return res.status(status).json({
    type: 'about:blank',
    title: status >= 500 ? 'Internal Server Error' : 'Request Error',
    status,
    detail: err.message || 'An unexpected server error occurred',
    instance,
    requestId: reqId,
  });
}
