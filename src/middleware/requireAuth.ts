import type { Request, Response, NextFunction } from 'express';
import { getSession } from '../services/authService.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session_token;
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  req.userId = session.userId;
  next();
}
