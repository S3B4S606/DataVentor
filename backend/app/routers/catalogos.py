from fastapi import APIRouter, HTTPException
from psycopg2 import IntegrityError
from app.database import get_connection, dict_cursor
from app.schemas import CrearAmbiente, ConfirmarEstadoEquipo

router = APIRouter(prefix="/api", tags=["Catálogos y equipos"])


@router.get("/sedes")
def listar_sedes():
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute("SELECT id_sede, descripcion, direccion FROM sedes ORDER BY descripcion")
        return [dict(row) for row in cur.fetchall()]


@router.get("/ambientes")
def listar_ambientes():
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute("""SELECT a.id_ambiente, a.id_sede, a.descripcion,
                              a.descripcion AS nombre, s.descripcion AS sede,
                              COUNT(e.id_equipo)::int AS total_equipos
                       FROM ambientes a
                       JOIN sedes s ON s.id_sede = a.id_sede
                       LEFT JOIN equipos e ON e.id_ambiente = a.id_ambiente
                       GROUP BY a.id_ambiente, a.id_sede, a.descripcion, s.descripcion
                       ORDER BY a.id_ambiente""")
        return [dict(row) for row in cur.fetchall()]


@router.post("/ambientes", status_code=201)
def crear_ambiente(datos: CrearAmbiente):
    descripcion = datos.descripcion.strip()
    if datos.nombre and datos.nombre.strip() and datos.nombre.strip().lower() != descripcion.lower():
        descripcion = f"{datos.nombre.strip()} - {descripcion}"[:150]
    with get_connection() as conn, dict_cursor(conn) as cur:
        if datos.id_sede:
            cur.execute("SELECT id_sede FROM sedes WHERE id_sede = %s", (datos.id_sede,))
        elif datos.sede:
            cur.execute("SELECT id_sede FROM sedes WHERE lower(descripcion) = lower(%s) LIMIT 1", (datos.sede.strip(),))
        else:
            raise HTTPException(status_code=422, detail="Debes indicar una sede existente mediante id_sede o sede.")
        sede = cur.fetchone()
        if not sede:
            raise HTTPException(status_code=422, detail="La sede indicada no existe. Consulta primero GET /api/sedes.")
        cur.execute("SELECT pg_advisory_xact_lock(20261021)")
        cur.execute("SELECT COALESCE(MAX(id_ambiente), 0) + 1 AS nuevo_id FROM ambientes")
        nuevo_id = cur.fetchone()["nuevo_id"]
        cur.execute("""INSERT INTO ambientes (id_ambiente, id_sede, descripcion)
                       VALUES (%s, %s, %s)
                       RETURNING id_ambiente, id_sede, descripcion""",
                    (nuevo_id, sede["id_sede"], descripcion))
        return dict(cur.fetchone())


_EQUIPOS_SQL = """SELECT e.id_equipo, e.id_ambiente, e.serial, e.registro_unico,
                           e.identificador_sistema, e.tipo, e.modelo,
                           e.estado::text AS estado, e.estado::text AS estado_equipo,
                           a.descripcion AS ambiente, a.id_sede,
                           s.descripcion AS sede
                    FROM equipos e
                    JOIN ambientes a ON a.id_ambiente = e.id_ambiente
                    JOIN sedes s ON s.id_sede = a.id_sede"""


@router.get("/equipos")
def listar_equipos():
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute(_EQUIPOS_SQL + " ORDER BY e.id_equipo")
        return [dict(row) for row in cur.fetchall()]


@router.get("/equipos/identificador")
def obtener_identificador_equipo():
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute(_EQUIPOS_SQL + " WHERE e.registro_unico IS NOT NULL ORDER BY e.id_equipo LIMIT 1")
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No hay equipos con registro único configurado.")
        return dict(row)


@router.get("/equipos/detectado")
def equipo_detectado():
    # La interfaz actual no envía un identificador de equipo/usuario. Se devuelve
    # el primer equipo registrado para que el flujo de demostración pueda funcionar.
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute(_EQUIPOS_SQL + " ORDER BY e.id_equipo LIMIT 1")
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Todavía no hay equipos registrados.")
        return dict(row)


@router.post("/equipos/confirmar-estado")
def confirmar_estado_equipo(datos: ConfirmarEstadoEquipo):
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute("""UPDATE equipos SET estado = CAST('buen_estado' AS estado_equipo_enum)
                       WHERE registro_unico = %s RETURNING id_equipo, registro_unico, estado::text AS estado""",
                    (datos.registro_unico.strip(),))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No existe un equipo con ese registro único.")
        return {"mensaje": "Estado del equipo confirmado.", "equipo": dict(row)}


@router.get("/equipos/{id_equipo}")
def obtener_equipo(id_equipo: int):
    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute(_EQUIPOS_SQL + " WHERE e.id_equipo = %s", (id_equipo,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Equipo no encontrado.")
        return dict(row)
