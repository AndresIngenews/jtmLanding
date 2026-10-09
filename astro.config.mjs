// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Carga .env en process.env para el servidor de desarrollo.
// En producción se usa `node --env-file-if-exists=.env` (ver script "start").
try {
  process.loadEnvFile('.env');
} catch {}

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: { checkOrigin: true },
  server: { port: 4321 },
});
