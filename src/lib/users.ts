import { execute, query, type RowDataPacket } from './db';
import { hashPassword, validatePasswordStrength } from './auth';

export interface AdminUserRow extends RowDataPacket {
  id: number;
  username: string;
  name: string;
  email: string | null;
  is_active: number;
  last_login_at: Date | null;
  created_at: Date;
}

/** Error con un mensaje apto para mostrar en el panel. */
export class UserError extends Error {}

const USERNAME = /^[a-zA-Z0-9._-]{3,60}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function listUsers(): Promise<AdminUserRow[]> {
  return query<AdminUserRow>(
    'SELECT id, username, name, email, is_active, last_login_at, created_at FROM admin_users ORDER BY is_active DESC, username',
  );
}

export interface NewUser {
  username: string;
  name: string;
  email: string;
  password: string;
  confirm: string;
}

export async function createUser(input: NewUser): Promise<string> {
  const username = input.username.trim();
  const name = input.name.trim().slice(0, 120);
  const email = input.email.trim();

  if (!USERNAME.test(username)) throw new UserError('Username: 3–60 characters, using only letters, numbers, dots, dashes or underscores.');
  if (email && (!EMAIL.test(email) || email.length > 190)) throw new UserError('The email address is not valid.');
  if (input.password !== input.confirm) throw new UserError('The two passwords do not match.');
  const weak = validatePasswordStrength(input.password);
  if (weak) throw new UserError(weak);

  const taken = await query<RowDataPacket>('SELECT username, email FROM admin_users WHERE username = ? OR (email IS NOT NULL AND email = ?)', [
    username,
    email || null,
  ]);
  if (taken.some((u) => String(u.username).toLowerCase() === username.toLowerCase())) throw new UserError(`The username "${username}" is already in use.`);
  if (taken.length) throw new UserError('Another admin already uses that email address.');

  await execute('INSERT INTO admin_users (username, name, email, password_hash) VALUES (?, ?, ?, ?)', [
    username,
    name,
    email || null,
    await hashPassword(input.password),
  ]);
  return username;
}

async function getUser(id: number): Promise<AdminUserRow> {
  if (!Number.isInteger(id) || id <= 0) throw new UserError('That admin no longer exists.');
  const [user] = await query<AdminUserRow>('SELECT id, username, name, email, is_active, last_login_at, created_at FROM admin_users WHERE id = ?', [id]);
  if (!user) throw new UserError('That admin no longer exists.');
  return user;
}

/** Activa o desactiva una cuenta. Nadie puede desactivarse a sí mismo y siempre queda un admin activo. */
export async function setActive(id: number, active: boolean, actorId: number): Promise<string> {
  const user = await getUser(id);
  if (!active) {
    if (id === actorId) throw new UserError('You cannot deactivate your own account.');
    const [{ total }] = await query<RowDataPacket & { total: number }>('SELECT COUNT(*) AS total FROM admin_users WHERE is_active = 1 AND id <> ?', [id]);
    if (Number(total) < 1) throw new UserError('There must always be at least one active admin.');
  }
  await execute('UPDATE admin_users SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
  // Al desactivar se cierran sus sesiones abiertas
  if (!active) await execute('DELETE FROM admin_sessions WHERE user_id = ?', [id]);
  return user.username;
}

/** Pone una contraseña nueva a otro admin (para cuando la olvida) y cierra sus sesiones abiertas. */
export async function resetPassword(id: number, password: string, confirm: string, actorId: number): Promise<string> {
  const user = await getUser(id);
  if (id === actorId) throw new UserError('To change your own password, use My account.');
  if (password !== confirm) throw new UserError('The two passwords do not match.');
  const weak = validatePasswordStrength(password);
  if (weak) throw new UserError(weak);
  await execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [await hashPassword(password), id]);
  await execute('DELETE FROM admin_sessions WHERE user_id = ?', [id]);
  return user.username;
}
