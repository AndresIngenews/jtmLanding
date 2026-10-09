// Crea las tablas en la BD configurada en .env y guarda los textos por defecto.
// Uso: npm run db:setup
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { defaultContent } from '../src/lib/content-schema.ts';

const database = process.env.DB_NAME ?? 'mtslanding_bd';
const conn = await mysql.createConnection({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  charset: 'utf8mb4',
  multipleStatements: true,
});

try {
  const schema = (await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8')).replaceAll('mtslanding_bd', database);
  await conn.query(schema);
  console.log(`✔ Tables created/verified in "${database}"`);

  const entries = Object.entries(defaultContent());
  const [result] = await conn.query<mysql.ResultSetHeader>(
    'INSERT IGNORE INTO site_content (content_key, value) VALUES ?',
    [entries],
  );
  console.log(`✔ Initial content: ${result.affectedRows} new keys (${entries.length - result.affectedRows} already existed)`);

  const [[{ total }]] = await conn.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS total FROM admin_users');
  if (Number(total) === 0) console.log('ℹ No admins yet. Create one with: npm run admin:create');
} finally {
  await conn.end();
}
