-- Esquema de la landing + panel administrador
-- Base de datos: mtslanding_bd (MySQL 8)

CREATE DATABASE IF NOT EXISTS mtslanding_bd
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mtslanding_bd;

-- Usuarios con acceso al panel
CREATE TABLE IF NOT EXISTS admin_users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username       VARCHAR(60)  NOT NULL,
  email          VARCHAR(190) NULL,
  name           VARCHAR(120) NOT NULL DEFAULT '',
  password_hash  VARCHAR(100) NOT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at  DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_username (username),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sesiones activas (se guarda el hash SHA-256 del token, nunca el token)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id          CHAR(64)     NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  ip          VARCHAR(45)  NULL,
  user_agent  VARCHAR(255) NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_sessions_user (user_id),
  KEY idx_admin_sessions_expires (expires_at),
  CONSTRAINT fk_admin_sessions_user FOREIGN KEY (user_id)
    REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intentos de login (para limitar fuerza bruta)
CREATE TABLE IF NOT EXISTS login_attempts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username    VARCHAR(60)  NOT NULL,
  ip          VARCHAR(45)  NULL,
  success     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_attempts_lookup (username, created_at),
  KEY idx_login_attempts_ip (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contenido editable de la landing (clave -> valor)
CREATE TABLE IF NOT EXISTS site_content (
  content_key  VARCHAR(120) NOT NULL,
  value        MEDIUMTEXT   NOT NULL,
  updated_by   INT UNSIGNED NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (content_key),
  CONSTRAINT fk_site_content_user FOREIGN KEY (updated_by)
    REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de cambios del contenido
CREATE TABLE IF NOT EXISTS content_revisions (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_key  VARCHAR(120) NOT NULL,
  old_value    MEDIUMTEXT   NULL,
  new_value    MEDIUMTEXT   NOT NULL,
  user_id      INT UNSIGNED NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_content_revisions_key (content_key, created_at),
  CONSTRAINT fk_content_revisions_user FOREIGN KEY (user_id)
    REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Biblioteca de imágenes subidas desde el panel
CREATE TABLE IF NOT EXISTS media (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename       VARCHAR(120) NOT NULL,
  original_name  VARCHAR(255) NOT NULL,
  mime_type      VARCHAR(60)  NOT NULL,
  size_bytes     INT UNSIGNED NOT NULL,
  width          INT UNSIGNED NULL,
  height         INT UNSIGNED NULL,
  alt_text       VARCHAR(255) NOT NULL DEFAULT '',
  uploaded_by    INT UNSIGNED NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_filename (filename),
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by)
    REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
