import { FIELDS, defaultContent } from './content-schema';
import { getPool, query, type RowDataPacket } from './db';

export type Content = Record<string, string>;

// Caché en memoria del contenido; se invalida al guardar desde el admin.
let cache: { data: Content; at: number } | undefined;
const CACHE_MS = 60_000;

interface ContentRow extends RowDataPacket {
  content_key: string;
  value: string;
}

export async function getContent(): Promise<Content> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const data = defaultContent();
  try {
    const rows = await query<ContentRow>('SELECT content_key, value FROM site_content');
    for (const row of rows) {
      if (FIELDS.has(row.content_key)) data[row.content_key] = row.value;
    }
    cache = { data, at: Date.now() };
  } catch (err) {
    // Si la BD no está disponible la landing se sirve con los textos por defecto.
    console.error('[content] Could not read site_content, falling back to defaults:', err);
  }
  return data;
}

export function invalidateContentCache(): void {
  cache = undefined;
}

/** Guarda los valores que hayan cambiado y registra cada cambio en el historial. Devuelve cuántos cambiaron. */
export async function saveContent(values: Content, userId: number): Promise<number> {
  const current = await getContent();
  const changed = Object.entries(values).filter(([key, value]) => FIELDS.has(key) && current[key] !== value);
  if (changed.length === 0) return 0;

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const [key, value] of changed) {
      await conn.execute(
        'INSERT INTO content_revisions (content_key, old_value, new_value, user_id, created_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())',
        [key, current[key] ?? null, value, userId],
      );
      await conn.execute(
        `INSERT INTO site_content (content_key, value, updated_by, updated_at) VALUES (?, ?, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by), updated_at = UTC_TIMESTAMP()`,
        [key, value, userId],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    invalidateContentCache();
  }
  return changed.length;
}

export interface Revision extends RowDataPacket {
  id: number;
  content_key: string;
  old_value: string | null;
  new_value: string;
  created_at: Date;
  username: string | null;
}

export function getRevisions(limit = 50, key?: string): Promise<Revision[]> {
  return query<Revision>(
    `SELECT r.id, r.content_key, r.old_value, r.new_value, r.created_at, u.username
     FROM content_revisions r LEFT JOIN admin_users u ON u.id = r.user_id
     ${key ? 'WHERE r.content_key = ?' : ''}
     ORDER BY r.id DESC LIMIT ?`,
    key ? [key, limit] : [limit],
  );
}

export async function getRevision(id: number): Promise<Revision | undefined> {
  const rows = await query<Revision>('SELECT id, content_key, old_value, new_value, created_at, NULL AS username FROM content_revisions WHERE id = ?', [id]);
  return rows[0];
}

/** Divide un texto en párrafos (línea en blanco) y líneas (salto simple). */
export function toParagraphs(value: string): string[][] {
  return value
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.split('\n'))
    .filter((lines) => lines.some((l) => l.trim() !== ''));
}

/** Divide una línea en segmentos normales y en negrita (**texto**). */
export function toSegments(line: string): { text: string; bold: boolean }[] {
  return line
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}
