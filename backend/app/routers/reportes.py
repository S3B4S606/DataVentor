
from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel, Field
from app.database import get_connection, dict_cursor
from app.schemas import CrearReporte, ActualizarEstadoReporte
from app.security import verify_access_token

router = APIRouter(prefix="/api", tags=["Reportes"])


# ============================================
# CONSULTA GENERAL DE REPORTES
# ============================================

_REPORTES_SQL = """
SELECT
    r.id_reporte,
    r.id_equipo,
    r.id_usuario,
    r.id_usuario_ultima_actualizacion,
    r.descripcion,
    r.prioridad::text AS prioridad,
    r.estado_reporte::text AS estado_reporte,
    r.fecha_reporte,
    r.fecha_cierre,
    r.fecha_actualizacion,
    e.serial,
    e.registro_unico,
    e.identificador_sistema,
    e.numero_etiqueta,
    e.tipo,
    e.modelo,
    e.estado::text AS estado_equipo,
    e.id_ambiente,
    a.descripcion AS ambiente,
    a.id_sede,
    s.descripcion AS sede,
    u.nombre,
    u.apellido,
    u.correo,
    u.rol::text AS rol
FROM reportes r
JOIN equipos e ON e.id_equipo = r.id_equipo
JOIN ambientes a ON a.id_ambiente = e.id_ambiente
JOIN sedes s ON s.id_sede = a.id_sede
JOIN usuarios u ON u.id_usuario = r.id_usuario
"""


# ============================================
# COMPROBAR TRIGGERS
# ============================================

def _history_trigger_exists(cur):
    cur.execute("""
        SELECT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgrelid = 'public.reportes'::regclass
              AND tgname = 'trg_auditoria_historial_estados'
              AND NOT tgisinternal
              AND tgenabled <> 'D'
        ) AS existe
    """)

    return bool(cur.fetchone()["existe"])


def _status_trigger_exists(cur):
    cur.execute("""
        SELECT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgrelid = 'public.reportes'::regclass
              AND tgname = 'trg_actualizar_estado_equipo'
              AND NOT tgisinternal
              AND tgenabled <> 'D'
        ) AS existe
    """)

    return bool(cur.fetchone()["existe"])


# ============================================
# VALIDAR USUARIO AUTENTICADO
# ============================================

def _validar_usuario(cur, authorization):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión para crear reportes."
        )

    partes = authorization.split(" ", 1)

    if (
        len(partes) != 2
        or partes[0].lower() != "bearer"
        or not partes[1].strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Token de autenticación no válido."
        )

    sesion = verify_access_token(partes[1].strip())

    if not sesion:
        raise HTTPException(
            status_code=401,
            detail="Sesión inválida o vencida."
        )

    try:
        id_usuario = int(sesion["sub"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Sesión inválida."
        )

    cur.execute(
        """
        SELECT id_usuario, rol::text AS rol
        FROM usuarios
        WHERE id_usuario = %s
        """,
        (id_usuario,)
    )

    usuario = cur.fetchone()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="El usuario no está registrado."
        )

    if (
        usuario["rol"] not in ("aprendiz", "instructor")
        or usuario["rol"] != sesion.get("rol")
    ):
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para crear reportes."
        )

    return id_usuario


# ============================================
# FUNCIÓN PARA GUARDAR REPORTES
# ============================================

def _guardar_reporte(
    cur,
    id_equipo,
    id_usuario,
    descripcion,
    prioridad
):
    if prioridad not in ("baja", "media", "alta"):
        raise HTTPException(
            status_code=422,
            detail="La prioridad no es válida."
        )

    descripcion = descripcion.strip()

    if len(descripcion) < 3:
        raise HTTPException(
            status_code=422,
            detail="La descripción debe tener al menos 3 caracteres."
        )

    historial_por_trigger = _history_trigger_exists(cur)
    estado_por_trigger = _status_trigger_exists(cur)

    cur.execute(
        """
        INSERT INTO reportes (
            id_equipo,
            id_usuario,
            descripcion,
            prioridad
        )
        VALUES (
            %s,
            %s,
            %s,
            CAST(%s AS prioridad_enum)
        )
        RETURNING id_reporte
        """,
        (
            id_equipo,
            id_usuario,
            descripcion,
            prioridad
        )
    )

    id_reporte = cur.fetchone()["id_reporte"]

    if not historial_por_trigger:
        cur.execute(
            """
            INSERT INTO historial_estados (
                id_reporte,
                id_usuario,
                estado,
                observaciones
            )
            VALUES (
                %s,
                %s,
                CAST('pendiente' AS estado_reporte_enum),
                %s
            )
            """,
            (
                id_reporte,
                id_usuario,
                f"Reporte creado. Prioridad: {prioridad}"
            )
        )

    if not estado_por_trigger:
        cur.execute(
            """
            UPDATE equipos
            SET estado = CAST(
                'mal_estado' AS estado_equipo_enum
            )
            WHERE id_equipo = %s
            """,
            (id_equipo,)
        )

    return id_reporte


# ============================================
# LISTAR REPORTES
# ============================================

@router.get("/reportes")
def listar_reportes(
    usuario: int | None = Query(default=None, gt=0)
):
    with get_connection() as conn, dict_cursor(conn) as cur:
        sql = _REPORTES_SQL
        params = []

        if usuario is not None:
            sql += " WHERE r.id_usuario = %s"
            params.append(usuario)

        sql += """
        ORDER BY r.fecha_reporte DESC, r.id_reporte DESC
        """

        cur.execute(sql, params)

        return [dict(row) for row in cur.fetchall()]


# ============================================
# REPORTE NORMAL: EQUIPO DETECTADO
# ============================================

@router.post("/reportes", status_code=201)
def crear_reporte(
    datos: CrearReporte,
    authorization: str | None = Header(default=None)
):
    with get_connection() as conn, dict_cursor(conn) as cur:

        id_usuario = _validar_usuario(
            cur,
            authorization
        )

        cur.execute(
            """
            SELECT id_equipo
            FROM equipos
            WHERE id_equipo = %s
            """,
            (datos.id_equipo,)
        )

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail="El equipo indicado no existe."
            )

        id_reporte = _guardar_reporte(
            cur=cur,
            id_equipo=datos.id_equipo,
            id_usuario=id_usuario,
            descripcion=datos.descripcion,
            prioridad=datos.prioridad
        )

        return {
            "mensaje": "Reporte creado correctamente.",
            "id_reporte": id_reporte,
            "id_equipo": datos.id_equipo
        }


# ============================================
# MODELO: REPORTAR DESDE OTRO EQUIPO
# ============================================

class ReporteOtroEquipo(BaseModel):
    id_sede: int = Field(gt=0)
    id_ambiente: int = Field(gt=0)
    numero_etiqueta: int = Field(ge=1, le=30)
    descripcion: str = Field(min_length=3)
    prioridad: str


# ============================================
# REPORTE DESDE OTRO EQUIPO
# ============================================

@router.post("/reportes/otro-equipo", status_code=201)
def crear_reporte_otro_equipo(
    datos: ReporteOtroEquipo,
    authorization: str | None = Header(default=None)
):
    with get_connection() as conn, dict_cursor(conn) as cur:

        # 1. Validar usuario autenticado.
        id_usuario = _validar_usuario(
            cur,
            authorization
        )

        # 2. Validar prioridad.
        if datos.prioridad not in (
            "baja",
            "media",
            "alta"
        ):
            raise HTTPException(
                status_code=422,
                detail="La prioridad no es válida."
            )

        # 3. Comprobar sede y ambiente.
        cur.execute(
            """
            SELECT a.id_ambiente
            FROM ambientes a
            JOIN sedes s ON s.id_sede = a.id_sede
            WHERE a.id_ambiente = %s
              AND s.id_sede = %s
            """,
            (
                datos.id_ambiente,
                datos.id_sede
            )
        )

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail="El ambiente no pertenece a la sede."
            )

        # 4. Buscar el computador por ambiente
        # y número de etiqueta.
        cur.execute(
            """
            SELECT id_equipo
            FROM equipos
            WHERE id_ambiente = %s
              AND numero_etiqueta = %s
            """,
            (
                datos.id_ambiente,
                datos.numero_etiqueta
            )
        )

        equipo = cur.fetchone()

        if equipo:
            id_equipo = equipo["id_equipo"]

        else:
            # 5. Registrar equipo provisional
            # cuando no existe esa etiqueta.
            #
            # La restricción UNIQUE sobre
            # (id_ambiente, numero_etiqueta)
            # evita duplicados por concurrencia.
            cur.execute(
                """
                INSERT INTO equipos (
                    id_ambiente,
                    numero_etiqueta,
                    tipo,
                    modelo,
                    estado
                )
                VALUES (
                    %s,
                    %s,
                    'computador',
                    'Sin identificar',
                    CAST(
                        'mal_estado' AS estado_equipo_enum
                    )
                )
                ON CONFLICT (
                    id_ambiente,
                    numero_etiqueta
                )
                WHERE numero_etiqueta IS NOT NULL
                DO UPDATE SET
                    numero_etiqueta =
                        EXCLUDED.numero_etiqueta
                RETURNING id_equipo
                """,
                (
                    datos.id_ambiente,
                    datos.numero_etiqueta
                )
            )

            id_equipo = cur.fetchone()["id_equipo"]

        # 6. Guardar el reporte.
        id_reporte = _guardar_reporte(
            cur=cur,
            id_equipo=id_equipo,
            id_usuario=id_usuario,
            descripcion=datos.descripcion,
            prioridad=datos.prioridad
        )

        return {
            "mensaje": "Reporte creado correctamente.",
            "id_reporte": id_reporte,
            "id_equipo": id_equipo,
            "id_ambiente": datos.id_ambiente,
            "numero_etiqueta": datos.numero_etiqueta
        }


# ============================================
# HISTORIAL DE UN REPORTE
# ============================================

@router.get("/reportes/{id_reporte}/historial")
def historial_reporte(id_reporte: int):
    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            """
            SELECT
                h.id_historial,
                h.id_reporte,
                h.id_usuario,
                h.estado::text AS estado,
                h.fecha,
                h.observaciones,
                u.nombre,
                u.apellido,
                u.correo
            FROM historial_estados h
            JOIN usuarios u
                ON u.id_usuario = h.id_usuario
            WHERE h.id_reporte = %s
            ORDER BY h.fecha, h.id_historial
            """,
            (id_reporte,)
        )

        rows = [dict(row) for row in cur.fetchall()]

        if not rows:
            cur.execute(
                """
                SELECT 1
                FROM reportes
                WHERE id_reporte = %s
                """,
                (id_reporte,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Reporte no encontrado."
                )

        return rows


# ============================================
# OBTENER REPORTE POR ID
# ============================================

@router.get("/reportes/{id_reporte}")
def obtener_reporte(id_reporte: int):
    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            _REPORTES_SQL +
            " WHERE r.id_reporte = %s",
            (id_reporte,)
        )

        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Reporte no encontrado."
            )

        return dict(row)


# ============================================
# ACTUALIZAR ESTADO DE UN REPORTE
# ============================================

@router.put("/reportes/{id_reporte}/estado")
def actualizar_estado_reporte(
    id_reporte: int,
    datos: ActualizarEstadoReporte
):
    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            """
            SELECT 1
            FROM usuarios
            WHERE id_usuario = %s
            """,
            (datos.id_usuario,)
        )

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail="El usuario que actualiza no existe."
            )

        cur.execute(
            """
            SELECT id_equipo
            FROM reportes
            WHERE id_reporte = %s
            """,
            (id_reporte,)
        )

        reporte = cur.fetchone()

        if not reporte:
            raise HTTPException(
                status_code=404,
                detail="Reporte no encontrado."
            )

        history_trigger = _history_trigger_exists(cur)
        status_trigger = _status_trigger_exists(cur)

        cur.execute(
            """
            UPDATE reportes
            SET estado_reporte = CAST(
                    %s AS estado_reporte_enum
                ),
                id_usuario_ultima_actualizacion = %s,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_reporte = %s
            """,
            (
                datos.estado,
                datos.id_usuario,
                id_reporte
            )
        )

        if not history_trigger:
            cur.execute(
                """
                INSERT INTO historial_estados (
                    id_reporte,
                    id_usuario,
                    estado,
                    observaciones
                )
                VALUES (
                    %s,
                    %s,
                    CAST(%s AS estado_reporte_enum),
                    %s
                )
                """,
                (
                    id_reporte,
                    datos.id_usuario,
                    datos.estado,
                    datos.observaciones
                )
            )

        elif datos.observaciones:
            cur.execute(
                """
                UPDATE historial_estados
                SET observaciones = %s
                WHERE id_historial = (
                    SELECT id_historial
                    FROM historial_estados
                    WHERE id_reporte = %s
                      AND id_usuario = %s
                    ORDER BY id_historial DESC
                    LIMIT 1
                )
                """,
                (
                    datos.observaciones.strip(),
                    id_reporte,
                    datos.id_usuario
                )
            )

        if not status_trigger:
            nuevo_estado_equipo = (
                "mal_estado"
                if datos.estado == "pendiente"
                else "en_revision"
                if datos.estado == "en_revision"
                else "buen_estado"
            )

            cur.execute(
                """
                UPDATE equipos
                SET estado = CAST(
                    %s AS estado_equipo_enum
                )
                WHERE id_equipo = %s
                """,
                (
                    nuevo_estado_equipo,
                    reporte["id_equipo"]
                )
            )

        return {
            "mensaje":
                "Estado del reporte actualizado correctamente."
        }
