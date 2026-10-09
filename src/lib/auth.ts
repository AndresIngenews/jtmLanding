import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AstroCookies } from 'astro';
import { execute, query, type RowDataPacket } from './db';

export const SESSION_COOKIE = 'mts_admin_session';
const BCRYPT_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
// Hash válido para comparar cuando el usuario no existe y así no revelar
// por tiempo de respuesta qué usuarios existen.
let dummyHash: Promise<string> | undefined;

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
}

const sessionTtlHours = () => Number(process.env.SESSION_TTL_HOURS ?? 12);
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return 'The password must be at least 10 characters long.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'The password must mix letters and numbers.';
  return null;
}

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  name: string;
  email: string | null;
  password_hash: string;
  is_active: number;
}

export async function isLockedOut(username: string, ip: string): Promise<boolean> {
  const rows = await query<RowDataPacket & { failed: number }>(
    `SELECT COUNT(*) AS failed FROM login_attempts
     WHERE success = 0 AND (username = ? OR ip = ?)
       AND created_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE`,
    [username, ip, LOCKOUT_MINUTES],
  );
  return Number(rows[0]?.failed ?? 0) >= MAX_FAILED_ATTEMPTS;
}

export async function verifyCredentials(username: string, password: string, ip: string): Promise<SessionUser | null> {
  const rows = await query<UserRow>(
    'SELECT id, username, name, email, password_hash, is_active FROM admin_users WHERE username = ? LIMIT 1',
    [username],
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? (await (dummyHash ??= bcrypt.hash('dummy-password', BCRYPT_COST))));
  const success = Boolean(user && ok && user.is_active);

  await execute('INSERT INTO login_attempts (username, ip, success, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())', [
    username.slice(0, 60),
    ip,
    success ? 1 : 0,
  ]);
  if (!success || !user) return null;

  await execute('UPDATE admin_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [user.id]);
  return { id: user.id, username: user.username, name: user.name, email: user.email };
}

export async function createSession(userId: number, ip: string, userAgent: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await execute(
    `INSERT INTO admin_sessions (id, user_id, ip, user_agent, expires_at, created_at)
     VALUES (?, ?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? HOUR, UTC_TIMESTAMP())`,
    [sha256(token), userId, ip, userAgent.slice(0, 255), sessionTtlHours()],
  );
  // Limpieza oportunista de sesiones e intentos antiguos
  await execute('DELETE FROM admin_sessions WHERE expires_at < UTC_TIMESTAMP()');
  await execute('DELETE FROM login_attempts WHERE created_at < UTC_TIMESTAMP() - INTERVAL 30 DAY');
  return token;
}

export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const rows = await query<UserRow>(
    `SELECT u.id, u.username, u.name, u.email
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > UTC_TIMESTAMP() AND u.is_active = 1
     LIMIT 1`,
    [sha256(token)],
  );
  const u = rows[0];
  return u ? { id: u.id, username: u.username, name: u.name, email: u.email } : null;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (token) await execute('DELETE FROM admin_sessions WHERE id = ?', [sha256(token)]);
}

export async function destroyOtherSessions(userId: number, keepToken: string | undefined): Promise<void> {
  await execute('DELETE FROM admin_sessions WHERE user_id = ? AND id <> ?', [userId, keepToken ? sha256(keepToken) : '']);
}

export async function changePassword(userId: number, current: string, next: string): Promise<string | null> {
  const rows = await query<UserRow>('SELECT password_hash FROM admin_users WHERE id = ?', [userId]);
  if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) return 'The current password is incorrect.';
  const weak = validatePasswordStrength(next);
  if (weak) return weak;
  await execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [await hashPassword(next), userId]);
  return null;
}

export function setSessionCookie(cookies: AstroCookies, token: string, secure: boolean): void {
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: sessionTtlHours() * 3600,
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
