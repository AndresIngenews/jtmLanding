// Crea un administrador o restablece la contraseña de uno existente.
// Uso: npm run admin:create
//      npm run admin:create -- --username admin --name "Nombre" --email a@b.com
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const { values: args } = parseArgs({
  options: {
    username: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
  },
});

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q: string, fallback = '') => (await rl.question(q)).trim() || fallback;

const username = args.username ?? (await ask('Username [admin]: ', 'admin'));
const name = args.name ?? (await ask('Name: '));
const email = args.email ?? (await ask('Email (optional): '));
const password = args.password ?? (await ask('Password (min. 10 characters, letters and numbers): '));
rl.close();

if (!/^[a-zA-Z0-9._-]{3,60}$/.test(username)) throw new Error('Invalid username: 3-60 characters (letters, numbers, . _ -).');
if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  throw new Error('The password must be at least 10 characters long and mix letters and numbers.');
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'mtslanding_bd',
});
try {
  const hash = await bcrypt.hash(password, 12);
  await conn.execute(
    `INSERT INTO admin_users (username, name, email, password_hash) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash), is_active = 1`,
    [username, name, email || null, hash],
  );
  console.log(`✔ Admin "${username}" ready. Sign in at /admin/login`);
} finally {
  await conn.end();
}
