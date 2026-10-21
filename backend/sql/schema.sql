-- Esquema inicial no destructivo para una base de datos NUEVA.
-- No elimina tablas ni tipos existentes. Revísalo antes de ejecutarlo en una base con datos.

DO $$ BEGIN
  CREATE TYPE rol_enum AS ENUM ('aprendiz', 'instructor', 'tecnico', 'administrador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE estado_equipo_enum AS ENUM ('buen_estado', 'mal_estado', 'en_revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE prioridad_enum AS ENUM ('baja', 'media', 'alta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE estado_reporte_enum AS ENUM ('pendiente', 'en_revision', 'resuelto', 'cerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE jornada_enum AS ENUM ('manana', 'tarde', 'noche');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INTEGER PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol rol_enum NOT NULL,
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_documento VARCHAR(10),
  documento VARCHAR(30) UNIQUE
);

CREATE TABLE IF NOT EXISTS sedes (
  id_sede SERIAL PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL,
  direccion VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS ambientes (
  id_ambiente INTEGER PRIMARY KEY,
  id_sede INTEGER NOT NULL REFERENCES sedes(id_sede) ON UPDATE CASCADE ON DELETE RESTRICT,
  descripcion VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipos (
  id_equipo INTEGER PRIMARY KEY,
  id_ambiente INTEGER NOT NULL REFERENCES ambientes(id_ambiente) ON UPDATE CASCADE ON DELETE RESTRICT,
  serial VARCHAR(100) NOT NULL UNIQUE,
  registro_unico VARCHAR(100) UNIQUE,
  identificador_sistema VARCHAR(255) UNIQUE,
  tipo VARCHAR(50) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  estado estado_equipo_enum NOT NULL DEFAULT 'buen_estado'
);

CREATE TABLE IF NOT EXISTS reportes (
  id_reporte SERIAL PRIMARY KEY,
  id_equipo INTEGER NOT NULL REFERENCES equipos(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  id_usuario_ultima_actualizacion INTEGER REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  descripcion TEXT NOT NULL,
  prioridad prioridad_enum NOT NULL DEFAULT 'media',
  estado_reporte estado_reporte_enum NOT NULL DEFAULT 'pendiente',
  fecha_reporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_estados (
  id_historial SERIAL PRIMARY KEY,
  id_reporte INTEGER NOT NULL REFERENCES reportes(id_reporte) ON UPDATE CASCADE ON DELETE CASCADE,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  estado estado_reporte_enum NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT
);

CREATE TABLE IF NOT EXISTS jornada (
  id_jornada INTEGER PRIMARY KEY,
  id_ambiente INTEGER NOT NULL REFERENCES ambientes(id_ambiente) ON UPDATE CASCADE ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  jornada jornada_enum NOT NULL,
  detalle TEXT,
  CONSTRAINT uq_jornada_ambiente_fecha UNIQUE (id_ambiente, fecha, jornada)
);

CREATE INDEX IF NOT EXISTS idx_equipos_ambiente ON equipos(id_ambiente);
CREATE INDEX IF NOT EXISTS idx_equipos_identificador ON equipos(identificador_sistema);
CREATE INDEX IF NOT EXISTS idx_reportes_equipo ON reportes(id_equipo);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario ON reportes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado_reporte);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_historial_reporte ON historial_estados(id_reporte);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_estados(id_usuario);
CREATE INDEX IF NOT EXISTS idx_jornada_ambiente ON jornada(id_ambiente);
