import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import { env } from '../config/env.js';
import { User } from '../db/models/index.js';
import type { Role } from '../db/models/User.js';
import type { IUser } from '../db/models/User.js';

export interface AuthPayload {
  uid: string;
  email?: string;
}

export interface AppRequest extends Request {
  auth?: AuthPayload;
  user?: IUser | null;
}

export async function requireAuth(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
  if (env.NODE_ENV === 'test' && typeof req.headers['x-test-user'] === 'string') {
    try {
      const payload = JSON.parse(req.headers['x-test-user']);
      if (payload?.uid) {
        req.auth = { uid: payload.uid, email: payload.email };
        next();
        return;
      }
    } catch {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TEST_USER', message: 'Invalid x-test-user header' },
      });
      return;
    }
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
    });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await auth.verifyIdToken(token);
    req.auth = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
}

export async function loadUser(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
    return;
  }
  const user = await User.findOne({ firebaseUid: req.auth.uid });
  if (!user) {
    res.status(403).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User record not found. Contact admin to be added to the system.',
      },
    });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AppRequest, res: Response, next: NextFunction): void => {
    const user = req.user as { role: Role } | undefined;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }
    next();
  };
}
