import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type Metadata } from 'sharp';
import { execute, query, type RowDataPacket } from './db';

export const UPLOAD_URL_PREFIX = '/uploads/';
export const SAFE_FILENAME = /^[a-z0-9-]+\.(webp|gif)$/;
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'heif']);
const MAX_DIMENSION = 2400;

export function uploadsDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'storage/uploads');
}

const maxBytes = () => Number(process.env.UPLOAD_MAX_MB ?? 8) * 1024 * 1024;

export interface MediaRow extends RowDataPacket {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  created_at: Date;
}

export const mediaUrl = (filename: string) => UPLOAD_URL_PREFIX + filename;

export class UploadError extends Error {}

/**
 * Valida y guarda una imagen. El archivo se decodifica con sharp (lo que
 * descarta cualquier cosa que no sea una imagen real) y se re-codifica a WebP
 * con un tamaño máximo razonable; los GIF se conservan para no perder animación.
 */
export async function saveUpload(file: File, userId: number, altText = ''): Promise<MediaRow> {
  if (!file || file.size === 0) throw new UploadError('No file was received.');
  if (file.size > maxBytes()) throw new UploadError(`The image exceeds the ${process.env.UPLOAD_MAX_MB ?? 8} MB limit.`);

  const input = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError('The file is not a valid image.');
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new UploadError('Format not allowed. Use JPG, PNG, WebP, GIF or AVIF.');
  }

  const isGif = meta.format === 'gif';
  const pipeline = sharp(input, { animated: isGif }).rotate().resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const { data, info } = isGif
    ? await pipeline.gif().toBuffer({ resolveWithObject: true })
    : await pipeline.webp({ quality: 84 }).toBuffer({ resolveWithObject: true });

  const ext = isGif ? 'gif' : 'webp';
  const filename = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.${ext}`;
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(path.join(uploadsDir(), filename), data);

  const result = await execute(
    `INSERT INTO media (filename, original_name, mime_type, size_bytes, width, height, alt_text, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
    [filename, file.name.slice(0, 255), `image/${ext}`, data.length, info.width, info.height, altText.slice(0, 255), userId],
  );
  const [row] = await query<MediaRow>('SELECT * FROM media WHERE id = ?', [result.insertId]);
  return row;
}

export function listMedia(): Promise<MediaRow[]> {
  return query<MediaRow>('SELECT * FROM media ORDER BY id DESC');
}

/** Devuelve las claves de contenido que usan la imagen. */
export async function mediaUsage(filename: string): Promise<string[]> {
  const rows = await query<RowDataPacket & { content_key: string }>('SELECT content_key FROM site_content WHERE value = ?', [
    mediaUrl(filename),
  ]);
  return rows.map((r) => r.content_key);
}

export async function deleteMedia(id: number): Promise<void> {
  const [row] = await query<MediaRow>('SELECT * FROM media WHERE id = ?', [id]);
  if (!row) return;
  const usedBy = await mediaUsage(row.filename);
  if (usedBy.length) throw new UploadError(`The image is in use (${usedBy.join(', ')}). Replace it before deleting.`);
  await execute('DELETE FROM media WHERE id = ?', [id]);
  await unlink(path.join(uploadsDir(), row.filename)).catch(() => {});
}
