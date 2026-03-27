import { Router } from 'express';
import { z } from 'zod';
import { createUser, verifyCredentials, createSession, deleteSession } from '../services/authService.js';
import { getUserWithFavorites } from '../services/favoritesService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { config } from '../config.js';

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  secure: config.NODE_ENV === 'production',
};

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { username, password } = parsed.data;

  try {
    const user = createUser(username, password);
    const token = createSession(user.id);
    const authedUser = getUserWithFavorites(user.id);
    res.cookie('session_token', token, COOKIE_OPTIONS);
    res.status(201).json(authedUser);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
    throw err;
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const { username, password } = parsed.data;
  const user = verifyCredentials(username, password);

  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = createSession(user.id);
  const authedUser = getUserWithFavorites(user.id);
  res.cookie('session_token', token, COOKIE_OPTIONS);
  res.json(authedUser);
});

authRouter.post('/logout', (req, res) => {
  const token = req.cookies?.session_token;
  if (token) {
    deleteSession(token);
  }
  res.clearCookie('session_token');
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = getUserWithFavorites(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});
