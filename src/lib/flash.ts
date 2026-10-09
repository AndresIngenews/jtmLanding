import type { AstroCookies } from 'astro';

const COOKIE = 'mts_flash';

export interface Flash {
  type: 'ok' | 'err';
  text: string;
}

export function setFlash(cookies: AstroCookies, type: Flash['type'], text: string): void {
  cookies.set(COOKIE, JSON.stringify({ type, text }), { path: '/admin', httpOnly: true, sameSite: 'lax', maxAge: 60 });
}

export function takeFlash(cookies: AstroCookies): Flash | null {
  const raw = cookies.get(COOKIE)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE, { path: '/admin' });
  try {
    const flash = JSON.parse(raw) as Flash;
    return flash.type === 'ok' || flash.type === 'err' ? flash : null;
  } catch {
    return null;
  }
}
