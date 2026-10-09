# Landing SEEN. — JT Maison

Landing en **Astro 7 (SSR, adaptador Node)** con panel de administración para editar textos e imágenes. Los datos se guardan en **MySQL** (`mtslanding_bd`).

## Requisitos

- Node.js 22.6+ (probado con 24)
- MySQL 8 (Laragon)

## Puesta en marcha

```bash
npm install
cp .env.example .env              # y ajusta las credenciales de MySQL
npm run db:setup                  # crea las tablas y carga los textos del diseño
npm run admin:create              # crea el primer administrador (los demás, desde Admin → Admins)
npm run dev                       # http://localhost:4321  ·  admin: /admin
```

> En Laragon usa `DB_HOST=localhost`: la cuenta `root@127.0.0.1` tiene otra contraseña distinta de `root@localhost`.

## Producción

```bash
npm run build
npm start                         # node --env-file-if-exists=.env dist/server/entry.mjs
```

Ejecuta `npm start` desde la raíz del proyecto (las imágenes subidas se guardan en `UPLOADS_DIR`, por defecto `storage/uploads`, que debe persistir entre despliegues). Sirve la web detrás de HTTPS: la cookie de sesión se marca `Secure` automáticamente.

## Estructura

```
db/schema.sql                 Tablas de la BD
scripts/db-setup.ts           Crea tablas + contenido inicial
scripts/create-admin.ts       Alta de administradores
src/lib/content-schema.ts     ★ Todos los campos editables (clave, tipo, valor por defecto)
src/lib/content.ts            Lectura/guardado de contenido + historial
src/lib/auth.ts               Login, sesiones, bloqueo por intentos fallidos
src/lib/media.ts              Subida y optimización de imágenes (sharp → WebP)
src/lib/users.ts              Alta, desactivación y cambio de contraseña de administradores
src/middleware.ts             Protege /admin/*
src/pages/index.astro         La landing (11 secciones del diseño)
src/pages/admin/              Panel: secciones, imágenes, historial, admins, cuenta
src/pages/uploads/[file].ts   Sirve las imágenes subidas
```

## Cómo añadir un campo editable

1. Añádelo a la sección correspondiente en `src/lib/content-schema.ts` (con su valor por defecto).
2. Úsalo en `src/pages/index.astro` como `c['mi.clave']` (con `<Lines>` o `<Prose>` si es texto largo).
   Para un botón nuevo, añade también `link('mi.clave.href', 'Destino', 'scorecard')` y usa `href={href('mi.clave.href')}`.

El panel genera el formulario automáticamente; no hace falta tocar la BD.

## Formato de los textos largos

- Línea en blanco → nuevo párrafo
- Salto de línea simple → `<br>`
- `**texto**` → negrita

## Tablas

| Tabla | Uso |
| --- | --- |
| `admin_users` | Usuarios del panel (contraseñas con bcrypt) |
| `admin_sessions` | Sesiones activas (se guarda el hash SHA-256 del token) |
| `login_attempts` | Intentos de login; 5 fallos en 15 min bloquean usuario/IP |
| `site_content` | Valor actual de cada campo editable |
| `content_revisions` | Historial de cambios (permite restaurar) |
| `media` | Imágenes subidas |

## Seguridad

- Contraseñas con bcrypt (coste 12), mínimo 10 caracteres con letras y números.
- Cookie de sesión `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS.
- Protección CSRF por comprobación de `Origin` (`security.checkOrigin` de Astro).
- Las imágenes se decodifican y re-codifican con sharp (no se sirven archivos tal cual) y los enlaces solo aceptan `https://`, `mailto:`, `tel:`, `#` o rutas `/`.
- Recomendado: crear un usuario MySQL propio para la app en vez de `root`.

## Destino de los botones

Cada botón y enlace de la landing (24 en total, incluido el logo y el CTA flotante) tiene su propio campo **Destination** en la sección donde aparece. Puede ser:

- **Un enlace general** (Scorecard, Playbook, Masterclass, Perception Audit, JT Maison). Se guarda como `@scorecard`, etc. Si cambias la URL del enlace general en **Admin → General & links**, se actualizan todos los botones que lo usan.
- **Una URL personalizada**: `https://`, `mailto:`, `tel:`, `#ancla` o `/ruta`.

Los destinos `http(s)://` de otro dominio se abren en una pestaña nueva (`target="_blank" rel="noopener noreferrer"`); los internos, `mailto:` y `tel:` se abren en la misma.

Las URLs de los enlaces generales venían como placeholders en el diseño (`#scorecard`, `#audit`…); hay que definirlas en el panel.
