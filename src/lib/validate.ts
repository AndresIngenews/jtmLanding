import { SHARED_LINKS, type Field } from './content-schema';

const MAX_LENGTH = 20_000;

// Enlaces permitidos: http(s), mailto, tel, anclas (#) y rutas relativas (/...)
const SAFE_URL = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s()-]+|#[\w-]*|\/(?!\/)[^\s]*)$/i;
// Imágenes: archivos propios de la web o URLs https externas
const SAFE_IMAGE = /^(\/(images|uploads)\/[\w.-]+|https:\/\/[^\s"'<>]+)$/i;

export type FieldResult = { ok: true; value: string } | { ok: false; error: string };

export function normalizeField(field: Field, raw: FormDataEntryValue | null): FieldResult {
  if (field.type === 'boolean') return { ok: true, value: raw ? '1' : '0' };

  let value = typeof raw === 'string' ? raw.replace(/\r\n/g, '\n') : '';
  value = field.type === 'textarea' ? value.replace(/\s+$/, '') : value.trim();

  if (value.length > MAX_LENGTH) return { ok: false, error: `"${field.label}" is too long.` };

  if (field.type === 'url') {
    if (!value) return { ok: false, error: `"${field.label}" cannot be empty.` };
    if (!SAFE_URL.test(value)) return { ok: false, error: `"${field.label}": use an https://, mailto: or tel: URL, a #anchor or a /path.` };
  }

  if (field.type === 'link') {
    if (value.startsWith('@')) {
      if (!Object.hasOwn(SHARED_LINKS, value.slice(1))) return { ok: false, error: `"${field.label}": unknown shared link.` };
    } else if (!value) {
      return { ok: false, error: `"${field.label}": enter the destination URL.` };
    } else if (!SAFE_URL.test(value)) {
      return { ok: false, error: `"${field.label}": use an https://, mailto: or tel: URL, a #anchor or a /path.` };
    }
  }

  if (field.type === 'image') {
    if (!value) return { ok: false, error: `"${field.label}" needs an image.` };
    if (!SAFE_IMAGE.test(value)) return { ok: false, error: `"${field.label}": invalid image path.` };
  }

  return { ok: true, value };
}
