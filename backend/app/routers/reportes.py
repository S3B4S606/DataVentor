from fastapi import APIRouter, HTTPException, Query
from app.database import get_connection, dict_cursor
from app.schemas import CrearReporte, ActualizarEstadoReporte

router = APIRouter(prefix="/api", tags=["Reportes"])

_REPORTES_SQL = """SELECT r.id_reporte, r.id_equipo, r.id_usuario,
                           r.id_usuario_ultima_actualizacion, r.descripcion,
                           r.prioridad::text AS prioridad,
                           r.estado_reporte::text AS estado_reporte,
                           r.fecha_reporte, r.fecha_cierre, r.fecha_actualizacion,
                           e.serial, e.registro_unico, e.identificador_sistema,
                           e.tipo, e.modelo, e.estado::text AS estado_equipo,
                           e.id_ambiente, a.descripcion AS ambiente,
                           a.id_sede, s.descripcion AS sede,
                           u.nombre, u.apellido, u.correo, u.rol::text AS rol
                    FROM reportes r
                    JOIN equipos e ON e.id_equipo = r.id_equipo
                    JOIN ambientes a ON a.id_ambiente = e.id_ambiente
                    JOIN sedes s ON s.id_sede = a.id_sede
                    JOIN usuarios u ON u.id_usuario = r.id_usuario"""


def _history_trigger_exists(cur):
    cur.execute("""SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgrelid = 'public.reportes'::regclass
          AND tgname = 'trg_auditoria_historial_estados'
          AND NOT tgisinternal
    ) AS existe""")
    return bool(cur.fetchone()["existe"])


def _status_trigger_exists(cur):
    cur.execute("""SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgrelid = 'public.reportes'::regclass
          AND tgname = 'trg_actualizar_estado_equipo'
          AND NOT tgisinternal
    ) AS existe""")
    return bool(cur.fetchone()["existe"])


@router.get("/reportes")
def listar_reportes(usuario: int | None = Query(default=None, gt=0)):
    with get_connection() as conn, dict_cursor(conn) as cur:
        sql = _REPORTES_SQL
        params = []
        if usuario is not None:
            sql += " WHERE r.id_usuario = %s"
            params.append(usuario)
        sql += " ORDER BY r.fecha_reporte DESC, r.id_reporte DESC"
        cur.execute(sql, params)
        return [dict(row) for row in cur.fetchall()]


@router.post("/reportes", status_code=201)
def crear_reporte(datos: CrearReporte):
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute("SELECT 1 FROM equipos WHERE id_equipo = %s", (datos.id_equipo,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="El equipo indicado no existe.")
        cur.execute("SELECT 1 FROM usuarios WHERE id_usuario = %s", (datos.id_usuario,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="El usuario indicado no existe.")
        cur.execute("""INSERT INTO reportes (id_equipo, id_usuario, descripcion, prioridad)
                       VALUES (%s, %s, %s, CAST(%s AS prioridad_enum))
                       RETURNING id_reporte""",
                    (datos.id_equipo, datos.id_usuario, datos.descripcion.strip(), datos.prioridad))
        nuevo = cur.fetchone()["id_reporte"]
        if not _history_trigger_exists(cur):
            cur.execute("""INSERT INTO historial_estados (id_reporte, id_usuario, estado, observaciones)
                           VALUES (%s, %s, CAST('pendiente' AS estado_reporte_enum), %s)""",
                        (nuevo, datos.id_usuario, f"Reporte creado. Prioridad: {datos.prioridad}"))
        if not _status_trigger_exists(cur):
            cur.execute("UPDATE equipos SET estado = CAST('mal_estado' AS estado_equipo_enum) WHERE id_equipo = %s", (datos.id_equipo,))
        return {"mensaje": "Reporte creado correctamente.", "id_reporte": nuevo}


@router.get("/reportes/{id_reporte}/historial")
def historial_reporte(id_reporte: int):
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute("""SELECT h.id_historial, h.id_reporte, h.id_usuario,
                              h.estado::text AS estado, h.fecha, h.observaciones,
                              u.nombre, u.apellido, u.correo
                       FROM historial_estados h
                       JOIN usuarios u ON u.id_usuario = h.id_usuario
                       WHERE h.id_reporte = %s
                       ORDER BY h.fecha, h.id_historial""", (id_reporte,))
        rows = [dict(row) for row in cur.fetchall()]
        if not rows:
            cur.execute("SELECT 1 FROM reportes WHERE id_reporte = %s", (id_reporte,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Reporte no encontrado.")
        return rows


@router.get("/reportes/{id_reporte}")
def obtener_reporte(id_reporte: int):
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute(_REPORTES_SQL + " WHERE r.id_reporte = %s", (id_reporte,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Reporte no encontrado.")
        return dict(row)


@router.put("/reportes/{id_reporte}/estado")
def actualizar_estado_reporte(id_reporte: int, datos: ActualizarEstadoReporte):
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute("SELECT 1 FROM usuarios WHERE id_usuario = %s", (datos.id_usuario,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="El usuario que actualiza no existe.")
        cur.execute("SELECT id_equipo FROM reportes WHERE id_reporte = %s", (id_reporte,))
        reporte = cur.fetchone()
        if not reporte:
            raise HTTPException(status_code=404, detail="Reporte no encontrado.")
        history_trigger = _history_trigger_exists(cur)
        status_trigger = _status_trigger_exists(cur)
        cur.execute("""UPDATE reportes
                       SET estado_reporte = CAST(%s AS estado_reporte_enum),
                           id_usuario_ultima_actualizacion = %s,
                           fecha_actualizacion = CURRENT_TIMESTAMP
                       WHERE id_reporte = %s""",
                    (datos.estado, datos.id_usuario, id_reporte))
        if not history_trigger:
            cur.execute("""INSERT INTO historial_estados (id_reporte, id_usuario, estado, observaciones)
                           VALUES (%s, %s, CAST(%s AS estado_reporte_enum), %s)""",
                        (id_reporte, datos.id_usuario, datos.estado, datos.observaciones))
        elif datos.observaciones:
            # El trigger existente ya inserta una fila; sustituimos su observación genérica.
            cur.execute("""UPDATE historial_estados SET observaciones = %s
                           WHERE id_historial = (
                             SELECT id_historial FROM historial_estados
                             WHERE id_reporte = %s AND id_usuario = %s
                             ORDER BY id_historial DESC LIMIT 1
                           )""", (datos.observaciones.strip(), id_reporte, datos.id_usuario))
        if not status_trigger:
            nuevo_estado_equipo = "mal_estado" if datos.estado == "pendiente" else "en_revision" if datos.estado == "en_revision" else "buen_estado"
            cur.execute("UPDATE equipos SET estado = CAST(%s AS estado_equipo_enum) WHERE id_equipo = %s", (nuevo_estado_equipo, reporte["id_equipo"]))
        return {"mensaje": "Estado del reporte actualizado correctamente."}
