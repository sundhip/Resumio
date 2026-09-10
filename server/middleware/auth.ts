import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/db';

export const JWT_SECRET = process.env.JWT_SECRET || 'resumio_phase1_super_secret_jwt_key_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'admin';
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(payload.userId) as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User session expired or user not found.',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Your account is inactive or suspended. Please contact support.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
    });
  }
}

export function requireRole(allowedRoles: ('candidate' | 'recruiter' | 'admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Requires ${allowedRoles.join(' or ')} permissions.`,
      });
      return;
    }

    next();
  };
}
