import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { SAFE_FILENAME, uploadsDir } from '../../lib/media';

const TYPES: Record<string, string> = { webp: 'image/webp', gif: 'image/gif' };

export const GET: APIRoute = async ({ params }) => {
  const file = params.file ?? '';
  if (!SAFE_FILENAME.test(file)) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(path.join(uploadsDir(), file));
    return new Response(data, {
      headers: {
        'Content-Type': TYPES[file.split('.').pop()!],
        // Los nombres son únicos, así que se pueden cachear indefinidamente
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
