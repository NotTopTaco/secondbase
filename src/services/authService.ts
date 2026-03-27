import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { getDb } from '../db/connection.js';
import type { User, Session } from '../types/auth.js';

const SALT_ROUNDS = 10;
const SESSION_TTL_DAYS = 30;

export function createUser(username: string, password: string): User {
  const db = getDb();
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  );
  const result = stmt.run(username, hash);
  return {
    id: result.lastInsertRowid as number,
    username,
    password_hash: hash,
    created_at: new Date().toISOString(),
  };
}

export function verifyCredentials(username: string, password: string): User | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return user;
}

export function createSession(userId: number): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function getSession(token: string): { userId: number } | null {
  const db = getDb();
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as Session | undefined;
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { userId: session.user_id };
}

export function deleteSession(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function cleanExpiredSessions(): void {
  const db = getDb();
  const result = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  if (result.changes > 0) {
    console.log(`[auth] Cleaned ${result.changes} expired sessions`);
  }
}
