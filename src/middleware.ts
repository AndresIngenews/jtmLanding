import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, getSessionUser } from './lib/auth';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/login/']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  context.locals.user = null;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    context.locals.user = await getSessionUser(token);

    if (!context.locals.user && !PUBLIC_ADMIN_PATHS.has(pathname)) {
      const nextUrl = encodeURIComponent(pathname + context.url.search);
      return context.redirect(`/admin/login?next=${nextUrl}`, 302);
    }

    const response = await next();
    // El panel nunca debe quedar en caché ni indexarse
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  return next();
});
