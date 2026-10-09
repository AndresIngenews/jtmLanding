import type { APIRoute } from 'astro';
import { SESSION_COOKIE, clearSessionCookie, destroySession } from '../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await destroySession(cookies.get(SESSION_COOKIE)?.value);
  clearSessionCookie(cookies);
  return redirect('/admin/login', 303);
};
