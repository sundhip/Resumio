import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../database/db';
import { JWT_SECRET } from '../middleware/auth';

export interface TokenPayload {
  userId: string;
  role: 'candidate' | 'recruiter' | 'admin';
  jti?: string; // JWT unique ID
}

export interface SecuritySession {
  sessionId: string;
  userId: string;
  role: string;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

// In-memory / high-speed Session Registry with SQLite/Mongo sync
const activeSessions: Map<string, SecuritySession> = new Map();
const revokedTokens: Set<string> = new Set();

export class SecurityManager {
  /**
   * Generates a short-lived access token (15 mins) and long-lived refresh token (7 days)
   */
  public static generateTokenPair(userId: string, role: 'candidate' | 'recruiter' | 'admin', req?: Request) {
    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(
      { userId, role, jti },
      JWT_SECRET,
      { expiresIn: '15m' } // Enterprise short-lived access token
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const sessionId = `sess_${crypto.randomUUID()}`;
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const ipAddress = req?.ip || req?.socket.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'unknown';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const session: SecuritySession = {
      sessionId,
      userId,
      role,
      refreshTokenHash,
      ipAddress,
      userAgent,
      createdAt: now.toISOString(),
      expiresAt,
      isRevoked: false,
    };

    activeSessions.set(sessionId, session);

    return {
      accessToken,
      refreshToken: `${sessionId}.${rawRefreshToken}`,
      expiresAt,
    };
  }

  /**
   * Rotates refresh token and generates a new pair with anti-replay detection
   */
  public static rotateRefreshToken(compositeToken: string, req?: Request) {
    const [sessionId, rawToken] = compositeToken.split('.');
    if (!sessionId || !rawToken) {
      throw new Error('Invalid refresh token format.');
    }

    const session = activeSessions.get(sessionId);
    if (!session || session.isRevoked) {
      throw new Error('Session has been revoked or expired.');
    }

    if (new Date(session.expiresAt) < new Date()) {
      activeSessions.delete(sessionId);
      throw new Error('Refresh session expired. Please sign in again.');
    }

    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    if (hash !== session.refreshTokenHash) {
      // Possible token replay attack! Invalidate session immediately
      session.isRevoked = true;
      activeSessions.set(sessionId, session);
      throw new Error('Token replay anomaly detected. Session revoked for security.');
    }

    // Revoke old session and issue new pair
    session.isRevoked = true;
    return this.generateTokenPair(session.userId, session.role as any, req);
  }

  /**
   * Blacklist an access token by unique ID
   */
  public static blacklistToken(jti: string) {
    if (jti) {
      revokedTokens.add(jti);
    }
  }

  public static isTokenBlacklisted(jti?: string): boolean {
    return jti ? revokedTokens.has(jti) : false;
  }

  /**
   * Revoke all sessions for a specific user (e.g., password reset / account compromise)
   */
  public static revokeAllUserSessions(userId: string) {
    for (const [_, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        session.isRevoked = true;
      }
    }
  }
}

/**
 * Enterprise Attribute-Based Access Control (ABAC) Permission Guard
 */
export type AppAction = 
  | 'job:create'
  | 'job:edit'
  | 'job:delete'
  | 'application:submit'
  | 'application:status_update'
  | 'resume:download'
  | 'candidate:view_pii'
  | 'admin:system_manage';

const ROLE_PERMISSIONS: Record<string, AppAction[]> = {
  candidate: ['application:submit', 'resume:download'],
  recruiter: ['job:create', 'job:edit', 'job:delete', 'application:status_update', 'resume:download', 'candidate:view_pii'],
  admin: [
    'job:create', 'job:edit', 'job:delete',
    'application:submit', 'application:status_update',
    'resume:download', 'candidate:view_pii', 'admin:system_manage'
  ],
};

export function requirePermission(action: AppAction) {
  return (req: any, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    if (!userRole) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const permissions = ROLE_PERMISSIONS[userRole] || [];
    if (!permissions.includes(action)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Action '${action}' requires elevated organizational permissions.`,
      });
      return;
    }

    next();
  };
}
