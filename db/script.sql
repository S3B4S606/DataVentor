DROP VIEW IF EXISTS vw_dashboard_reportes CASCADE;
DROP VIEW IF EXISTS vw_equipos_ambiente CASCADE;
DROP VIEW IF EXISTS vw_reportes_detalle CASCADE;

DROP TRIGGER IF EXISTS trg_actualizar_estado_equipo ON reportes;
DROP TRIGGER IF EXISTS trg_auditoria_historial_estados ON reportes;
DROP TRIGGER IF EXISTS trg_cerrar_reporte ON reportes;
DROP TRIGGER IF EXISTS trg_validar_crear_reporte ON reportes;

DROP FUNCTION IF EXISTS fn_actualizar_estado_equipo();
DROP FUNCTION IF EXISTS fn_registrar_historial_estados();
DROP FUNCTION IF EXISTS fn_cerrar_reporte();
DROP FUNCTION IF EXISTS fn_validar_crear_reporte();

DROP TABLE IF EXISTS historial_estados CASCADE;
DROP TABLE IF EXISTS reportes CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS jornada CASCADE;
DROP TABLE IF EXISTS ambientes CASCADE;
DROP TABLE IF EXISTS sedes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

DROP TYPE IF EXISTS rol_enum CASCADE;
DROP TYPE IF EXISTS estado_equipo_enum CASCADE;
DROP TYPE IF EXISTS prioridad_enum CASCADE;
DROP TYPE IF EXISTS estado_reporte_enum CASCADE;
DROP TYPE IF EXISTS jornada_enum CASCADE;


--  TIPOS ENUM

CREATE TYPE rol_enum AS ENUM (
    'aprendiz',
    'instructor',
    'tecnico',
    'administrador'
);

CREATE TYPE estado_equipo_enum AS ENUM (
    'buen_estado',
    'mal_estado',
    'en_revision'
);

CREATE TYPE prioridad_enum AS ENUM (
    'baja',
    'media',
    'alta'
);

CREATE TYPE estado_reporte_enum AS ENUM (
    'pendiente',
    'en_revision',
    'resuelto',
    'cerrado'
);

CREATE TYPE jornada_enum AS ENUM (
    'manana',
    'tarde',
    'noche'
);


--  TABLA USUARIOS

CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    documento VARCHAR(30) NOT NULL UNIQUE,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol rol_enum NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TABLA RECUPERAR CONTRASEÑA

CREATE TABLE IF NOT EXISTS recuperacion_contrasenas (
    id_recuperacion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    fecha_expiracion TIMESTAMP NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_recuperacion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recuperacion_usuario
ON recuperacion_contrasenas(id_usuario);

CREATE INDEX IF NOT EXISTS idx_recuperacion_expiracion
ON recuperacion_contrasenas(fecha_expiracion);


--  TABLA SEDES

CREATE TABLE sedes (
    id_sede SERIAL PRIMARY KEY,
    descripcion VARCHAR(150) NOT NULL,
    direccion VARCHAR(200) NOT NULL
);


-- TABLA AMBIENTES

CREATE TABLE ambientes (
    id_ambiente INT PRIMARY KEY,
    id_sede INT NOT NULL,
    descripcion VARCHAR(150) NOT NULL,

    CONSTRAINT fk_ambiente_sede
        FOREIGN KEY (id_sede)
        REFERENCES sedes(id_sede)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


--  TABLA EQUIPOS

CREATE TABLE equipos (
    id_equipo INT PRIMARY KEY,
    id_ambiente INT NOT NULL,

    serial VARCHAR(100) NOT NULL UNIQUE,

    registro_unico VARCHAR(100) UNIQUE,

    identificador_sistema VARCHAR(255) UNIQUE,

    tipo VARCHAR(50) NOT NULL,

    modelo VARCHAR(100) NOT NULL,

    estado estado_equipo_enum NOT NULL DEFAULT 'buen_estado',

    CONSTRAINT fk_equipo_ambiente
        FOREIGN KEY (id_ambiente)
        REFERENCES ambientes(id_ambiente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


--  TABLA REPORTES

CREATE TABLE reportes (
    id_reporte SERIAL PRIMARY KEY,

    id_equipo INT NOT NULL,

    id_usuario INT NOT NULL,

    id_usuario_ultima_actualizacion INT NULL,

    descripcion TEXT NOT NULL,

    prioridad prioridad_enum NOT NULL DEFAULT 'media',

    estado_reporte estado_reporte_enum NOT NULL DEFAULT 'pendiente',

    fecha_reporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_cierre TIMESTAMP NULL,

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reporte_equipo
        FOREIGN KEY (id_equipo)
        REFERENCES equipos(id_equipo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_reporte_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_reporte_usuario_actualizacion
        FOREIGN KEY (id_usuario_ultima_actualizacion)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


--  TABLA HISTORIAL DE ESTADOS

CREATE TABLE historial_estados (
    id_historial SERIAL PRIMARY KEY,

    id_reporte INT NOT NULL,

    id_usuario INT NOT NULL,

    estado estado_reporte_enum NOT NULL,

    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    observaciones TEXT,

    CONSTRAINT fk_historial_reporte
        FOREIGN KEY (id_reporte)
        REFERENCES reportes(id_reporte)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


--  TABLA JORNADA

CREATE TABLE jornada (
    id_jornada INT PRIMARY KEY,

    id_ambiente INT NOT NULL,

    fecha DATE NOT NULL,

    jornada jornada_enum NOT NULL,

    detalle TEXT,

    CONSTRAINT fk_jornada_ambiente
        FOREIGN KEY (id_ambiente)
        REFERENCES ambientes(id_ambiente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_jornada_ambiente_fecha
        UNIQUE (id_ambiente, fecha, jornada)
);


-- ÍNDICES

CREATE INDEX idx_equipos_ambiente
ON equipos(id_ambiente);

CREATE INDEX idx_equipos_identificador
ON equipos(identificador_sistema);

CREATE INDEX idx_reportes_equipo
ON reportes(id_equipo);

CREATE INDEX idx_reportes_usuario
ON reportes(id_usuario);

CREATE INDEX idx_reportes_estado
ON reportes(estado_reporte);

CREATE INDEX idx_reportes_fecha
ON reportes(fecha_reporte);

CREATE INDEX idx_historial_reporte
ON historial_estados(id_reporte);

CREATE INDEX idx_historial_usuario
ON historial_estados(id_usuario);

CREATE INDEX idx_jornada_ambiente
ON jornada(id_ambiente);


-- TRIGGER 1 ACTUALIZAR ESTADO DEL EQUIPO

CREATE OR REPLACE FUNCTION fn_actualizar_estado_equipo()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.estado_reporte = 'pendiente' THEN

        UPDATE equipos
        SET estado = 'mal_estado'
        WHERE id_equipo = NEW.id_equipo;

    ELSIF NEW.estado_reporte = 'en_revision' THEN

        UPDATE equipos
        SET estado = 'en_revision'
        WHERE id_equipo = NEW.id_equipo;

    ELSIF NEW.estado_reporte IN ('resuelto', 'cerrado') THEN

        UPDATE equipos
        SET estado = 'buen_estado'
        WHERE id_equipo = NEW.id_equipo;

    END IF;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_actualizar_estado_equipo
AFTER INSERT OR UPDATE OF estado_reporte
ON reportes
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_estado_equipo();


-- TRIGGER 2 REGISTRAR HISTORIAL

CREATE OR REPLACE FUNCTION fn_registrar_historial_estados()
RETURNS TRIGGER AS $$
DECLARE
    v_usuario INT;
BEGIN

    v_usuario := COALESCE(
        NEW.id_usuario_ultima_actualizacion,
        NEW.id_usuario
    );

    INSERT INTO historial_estados (
        id_reporte,
        id_usuario,
        estado,
        observaciones
    )
    VALUES (
        NEW.id_reporte,
        v_usuario,
        NEW.estado_reporte,
        CONCAT(
            'Reporte en estado: ',
            NEW.estado_reporte,
            ' | Prioridad: ',
            NEW.prioridad
        )
    );

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_auditoria_historial_estados
AFTER INSERT OR UPDATE OF estado_reporte
ON reportes
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_historial_estados();


-- TRIGGER 3 FECHA DE CIERRE

CREATE OR REPLACE FUNCTION fn_cerrar_reporte()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.estado_reporte IN ('resuelto', 'cerrado')
       AND OLD.fecha_cierre IS NULL THEN

        NEW.fecha_cierre := CURRENT_TIMESTAMP;

    END IF;

    IF NEW.estado_reporte IN ('pendiente', 'en_revision') THEN

        NEW.fecha_cierre := NULL;

    END IF;

    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_cerrar_reporte
BEFORE UPDATE OF estado_reporte
ON reportes
FOR EACH ROW
EXECUTE FUNCTION fn_cerrar_reporte();


--  TRIGGER 4 VALIDAR CREACIÓN DEL REPORTE

CREATE OR REPLACE FUNCTION fn_validar_crear_reporte()
RETURNS TRIGGER AS $$
DECLARE
    v_estado_actual estado_equipo_enum;
BEGIN

    SELECT estado
    INTO v_estado_actual
    FROM equipos
    WHERE id_equipo = NEW.id_equipo;

    IF NOT FOUND THEN

        RAISE EXCEPTION
        'El equipo con ID % no existe en el sistema.',
        NEW.id_equipo;

    END IF;

    IF NEW.fecha_reporte IS NULL THEN
        NEW.fecha_reporte := CURRENT_TIMESTAMP;
    END IF;

    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_validar_crear_reporte
BEFORE INSERT
ON reportes
FOR EACH ROW
EXECUTE FUNCTION fn_validar_crear_reporte();


-- VISTA DE REPORTES DETALLADOS

CREATE OR REPLACE VIEW vw_reportes_detalle AS
SELECT

    r.id_reporte,

    r.descripcion,

    r.prioridad,

    r.estado_reporte,

    r.fecha_reporte,

    r.fecha_cierre,

    r.fecha_actualizacion,

    e.id_equipo,

    e.serial,

    e.registro_unico,

    e.identificador_sistema,

    e.tipo,

    e.modelo,

    e.estado AS estado_equipo,

    a.id_ambiente,

    a.descripcion AS ambiente,

    s.id_sede,

    s.descripcion AS sede,

    s.direccion,

    u.id_usuario,

    CONCAT(
        u.nombre,
        ' ',
        u.apellido
    ) AS usuario,

    u.correo,

    u.rol

FROM reportes r

INNER JOIN equipos e
    ON r.id_equipo = e.id_equipo

INNER JOIN ambientes a
    ON e.id_ambiente = a.id_ambiente

INNER JOIN sedes s
    ON a.id_sede = s.id_sede

INNER JOIN usuarios u
    ON r.id_usuario = u.id_usuario;


-- VISTA DE EQUIPOS POR AMBIENTE

CREATE OR REPLACE VIEW vw_equipos_ambiente AS
SELECT

    e.id_equipo,

    e.serial,

    e.registro_unico,

    e.identificador_sistema,

    e.tipo,

    e.modelo,

    e.estado,

    a.id_ambiente,

    a.descripcion AS ambiente,

    s.id_sede,

    s.descripcion AS sede,

    s.direccion

FROM equipos e

INNER JOIN ambientes a
    ON e.id_ambiente = a.id_ambiente

INNER JOIN sedes s
    ON a.id_sede = s.id_sede;


--  VISTA PARA DASHBOARD

CREATE OR REPLACE VIEW vw_dashboard_reportes AS
SELECT

    COUNT(*) AS total_reportes,

    COUNT(*) FILTER (
        WHERE estado_reporte = 'pendiente'
    ) AS reportes_pendientes,

    COUNT(*) FILTER (
        WHERE estado_reporte = 'en_revision'
    ) AS reportes_en_revision,

    COUNT(*) FILTER (
        WHERE estado_reporte = 'resuelto'
    ) AS reportes_resueltos,

    COUNT(*) FILTER (
        WHERE estado_reporte = 'cerrado'
    ) AS reportes_cerrados,

    COUNT(*) FILTER (
        WHERE prioridad = 'alta'
    ) AS reportes_prioridad_alta

FROM reportes;


BEGIN;

-- Agregar el número de la etiqueta del SENA.
ALTER TABLE equipos
ADD COLUMN IF NOT EXISTS numero_etiqueta SMALLINT;

-- Permitir computadores sin serial identificado.
ALTER TABLE equipos
ALTER COLUMN serial DROP NOT NULL;

-- Validar que las etiquetas sean del 1 al 30.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'equipos'::regclass
          AND conname = 'chk_numero_etiqueta'
    ) THEN
        ALTER TABLE equipos
        ADD CONSTRAINT chk_numero_etiqueta
        CHECK (
            numero_etiqueta IS NULL
            OR numero_etiqueta BETWEEN 1 AND 30
        );
    END IF;
END $$;

-- Evitar que se repita un número dentro del
-- mismo ambiente.
CREATE UNIQUE INDEX IF NOT EXISTS
uq_equipo_ambiente_etiqueta
ON equipos (id_ambiente, numero_etiqueta)
WHERE numero_etiqueta IS NOT NULL;

-- Generar automáticamente el ID de nuevos equipos.
CREATE SEQUENCE IF NOT EXISTS equipos_id_equipo_seq;

SELECT setval(
    'equipos_id_equipo_seq',
    GREATEST(
        (SELECT COALESCE(MAX(id_equipo), 0) FROM equipos),
        1
    ),
    (SELECT COUNT(*) > 0 FROM equipos)
);

ALTER TABLE equipos
ALTER COLUMN id_equipo
SET DEFAULT nextval('equipos_id_equipo_seq');

ALTER SEQUENCE equipos_id_equipo_seq
OWNED BY equipos.id_equipo;

COMMIT;


-- CONSULTAS DE COMPROBACIÓN


SELECT * FROM usuarios;

SELECT * FROM sedes;

SELECT * FROM ambientes;

SELECT * FROM equipos;

SELECT * FROM reportes;

SELECT * FROM historial_estados;

SELECT * FROM jornada;

SELECT * FROM vw_reportes_detalle;

SELECT * FROM vw_equipos_ambiente;

SELECT current_database();

SHOW server_encoding;

SHOW client_encoding;

SELECT 
    id_sede,
    descripcion,
    direccion
FROM sedes
LIMIT 5;    
    
INSERT INTO sedes (
    id_sede,
    descripcion,
    direccion
)
VALUES (
    1,
    'Sede calle 52',
    'Calle 52 # 13-65'
);



SELECT 
    id_ambiente,
    id_sede,
    descripcion
FROM ambientes
LIMIT 5;    

INSERT INTO ambientes (
    id_ambiente,
    id_sede,
    descripcion
)
VALUES (
    109,
    1,
    'Ambiente 109'
);
    
SELECT 
    id_usuario,
    nombre,
    apellido,
    tipo_documento,
    documento,
    correo,
    rol
FROM usuarios
LIMIT 5;

INSERT INTO usuarios (
    id_usuario,
    tipo_documento,
    documento,
    nombre,
    apellido,
    correo,
    contrasena,
    telefono,
    rol
)
values
(1, 'CC', '123456789', 'Karol', 'Rivera', 'karol69054089@gmail.com', '123', '3208173037', 'administrador'),
(2, 'CC', '12345678', 'Sebastian', 'Acosta', 'sebastianacosta1824@gmail.com', '123', '3013808916', 'aprendiz'),
(3, 'CC', '1234567', 'Santiago', 'Sierra', 'santiagosierram17@gmail.com', '123', '3227343990', 'tecnico'),
(4, 'CC', '123456', 'Juan', 'Beltran', 'juanbeltran9500@gmail.com', '123', '3212352939', 'instructor'),
(5, 'CC', '12345', 'Lizeth', 'Lopez', 'lizethlopez1226@gmail.com', '123', '3028365535', 'tecnico');

BEGIN;

-- Permitir registrar computadores sin conocer el serial
ALTER TABLE public.equipos
ALTER COLUMN serial DROP NOT NULL;

-- Crear una secuencia para los nuevos identificadores
CREATE SEQUENCE IF NOT EXISTS public.equipos_id_equipo_seq;

-- Sincronizar la secuencia con los equipos existentes
SELECT setval(
    'public.equipos_id_equipo_seq',
    GREATEST(
        (SELECT COALESCE(MAX(id_equipo), 0) FROM public.equipos),
        1
    ),
    (SELECT COUNT(*) > 0 FROM public.equipos)
);

-- Asignar identificadores automáticamente
ALTER TABLE public.equipos
ALTER COLUMN id_equipo
SET DEFAULT nextval('public.equipos_id_equipo_seq'::regclass);

ALTER SEQUENCE public.equipos_id_equipo_seq
OWNED BY public.equipos.id_equipo;

COMMIT;





SELECT
    id_equipo,
    id_ambiente,
    numero_etiqueta,
    tipo,
    modelo,
    serial,
    identificador_sistema
FROM equipos
ORDER BY id_ambiente, numero_etiqueta;


SELECT
    conname AS restriccion,
    pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'public.equipos'::regclass;



-- ==========================================
-- DATAVENTOR
-- REGISTRAR AMBIENTES OFICIALES CALLE 52
-- ==========================================

INSERT INTO ambientes (
    id_ambiente,
    id_sede,
    descripcion
)
SELECT
    nuevos.id_ambiente,
    s.id_sede,
    nuevos.descripcion
FROM (
    VALUES
    -- PISO 6
    (608, 'Ambiente 608'),
    (609, 'Ambiente 609'),

    -- PISO 5
    (500, 'Ambiente 500'),
    (501, 'Ambiente 501'),
    (509, 'Ambiente 509'),
    (510, 'Ambiente 510'),
    (511, 'Ambiente 511'),

    -- PISO 4
    (401, 'Ambiente 401'),
    (408, 'Ambiente 408'),
    (409, 'Ambiente 409'),
    (410, 'Ambiente 410'),
    (412, 'Ambiente 412'),
    (413, 'Ambiente 413'),
    (414, 'Ambiente 414'),
    (415, 'Ambiente 415'),

    -- PISO 2
    (205, 'Ambiente 205'),
    (210, 'Ambiente 210'),
    (211, 'Ambiente 211'),
    (212, 'Ambiente 212'),

    -- PISO 1
    (101, 'Ambiente 101 Estudio'),
    (107, 'Ambiente 107'),
    (108, 'Ambiente 108')

) AS nuevos(id_ambiente, descripcion)


-- ==========================================
-- DATAVENTOR
-- REGISTRAR 30 PUESTOS POR AMBIENTE
-- SEDE CALLE 52
-- ==========================================

INSERT INTO equipos (
    id_ambiente,
    tipo,
    modelo,
    numero_etiqueta
)
SELECT
    a.id_ambiente,
    'computador',
    'Sin identificar',
    numeros.numero
FROM ambientes a
JOIN sedes s
    ON a.id_sede = s.id_sede
CROSS JOIN generate_series(1, 30) AS numeros(numero)
WHERE LOWER(TRIM(s.descripcion)) = 'calle 52'
AND NOT EXISTS (
    SELECT 1
    FROM equipos e
    WHERE e.id_ambiente = a.id_ambiente
    AND e.numero_etiqueta = numeros.numero
);



SELECT 'sedes' AS tabla, COUNT(*) AS registros FROM sedes
UNION ALL
SELECT 'ambientes', COUNT(*) FROM ambientes
UNION ALL
SELECT 'equipos', COUNT(*) FROM equipos
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'reportes', COUNT(*) FROM reportes
UNION ALL
SELECT 'historial_estados', COUNT(*) FROM historial_estados
UNION ALL
SELECT 'jornada', COUNT(*) FROM jornada
UNION ALL
SELECT 'recuperacion_contrasenas', COUNT(*) FROM recuperacion_contrasenas;
