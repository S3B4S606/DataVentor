
from fastapi import APIRouter, HTTPException, Header
from app.database import get_connection, dict_cursor
from app.schemas import CrearAmbiente, ConfirmarEstadoEquipo
from app.security import verify_access_token
from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/api",
    tags=["Catálogos y equipos"]
)


# ==========================================
# SEDES
# ==========================================

@router.get("/sedes")
def listar_sedes():

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            """
            SELECT id_sede, descripcion, direccion
            FROM sedes
            ORDER BY descripcion
            """
        )

        return [dict(row) for row in cur.fetchall()]


# ==========================================
# AMBIENTES
# ==========================================

@router.get("/ambientes")
def listar_ambientes():

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            """
            SELECT
                a.id_ambiente,
                a.id_sede,
                a.descripcion,
                a.descripcion AS nombre,
                s.descripcion AS sede,
                COUNT(e.id_equipo)::int AS total_equipos
            FROM ambientes a
            JOIN sedes s
                ON s.id_sede = a.id_sede
            LEFT JOIN equipos e
                ON e.id_ambiente = a.id_ambiente
            GROUP BY
                a.id_ambiente,
                a.id_sede,
                a.descripcion,
                s.descripcion
            ORDER BY a.id_ambiente
            """
        )

        return [dict(row) for row in cur.fetchall()]


@router.post("/ambientes", status_code=201)
def crear_ambiente(datos: CrearAmbiente):

    descripcion = datos.descripcion.strip()

    if (
        datos.nombre
        and datos.nombre.strip()
        and datos.nombre.strip().lower() != descripcion.lower()
    ):
        descripcion = (
            f"{datos.nombre.strip()} - {descripcion}"
        )[:150]

    with get_connection() as conn, dict_cursor(conn) as cur:

        if datos.id_sede:

            cur.execute(
                """
                SELECT id_sede
                FROM sedes
                WHERE id_sede = %s
                """,
                (datos.id_sede,)
            )

        elif datos.sede:

            cur.execute(
                """
                SELECT id_sede
                FROM sedes
                WHERE lower(descripcion) = lower(%s)
                LIMIT 1
                """,
                (datos.sede.strip(),)
            )

        else:

            raise HTTPException(
                status_code=422,
                detail=(
                    "Debes indicar una sede existente "
                    "mediante id_sede o sede."
                )
            )

        sede = cur.fetchone()

        if not sede:

            raise HTTPException(
                status_code=422,
                detail="La sede indicada no existe."
            )

        cur.execute(
            "SELECT pg_advisory_xact_lock(20261021)"
        )

        cur.execute(
            """
            SELECT COALESCE(MAX(id_ambiente), 0) + 1 AS nuevo_id
            FROM ambientes
            """
        )

        nuevo_id = cur.fetchone()["nuevo_id"]

        cur.execute(
            """
            INSERT INTO ambientes (
                id_ambiente,
                id_sede,
                descripcion
            )
            VALUES (%s, %s, %s)
            RETURNING
                id_ambiente,
                id_sede,
                descripcion
            """,
            (
                nuevo_id,
                sede["id_sede"],
                descripcion
            )
        )

        return dict(cur.fetchone())


# ==========================================
# CONSULTA GENERAL DE EQUIPOS
# ==========================================

_EQUIPOS_SQL = """
SELECT
    e.id_equipo,
    e.id_ambiente,
    e.serial,
    e.registro_unico,
    e.identificador_sistema,
    e.numero_etiqueta,
    e.tipo,
    e.modelo,
    e.estado::text AS estado,
    e.estado::text AS estado_equipo,
    a.descripcion AS ambiente,
    a.id_sede,
    s.descripcion AS sede
FROM equipos e
JOIN ambientes a
    ON a.id_ambiente = e.id_ambiente
JOIN sedes s
    ON s.id_sede = a.id_sede
"""


@router.get("/equipos")
def listar_equipos():

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            _EQUIPOS_SQL + " ORDER BY e.id_equipo"
        )

        return [dict(row) for row in cur.fetchall()]


# ==========================================
# BUSCAR EQUIPO POR CODIGO
# ==========================================

@router.get("/equipos/por-codigo/{codigo}")
def obtener_equipo_por_codigo(codigo: str):

    codigo = codigo.strip()

    if not codigo:

        raise HTTPException(
            status_code=400,
            detail="Debes proporcionar un código de equipo."
        )

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            _EQUIPOS_SQL +
            " WHERE e.registro_unico = %s",
            (codigo,)
        )

        row = cur.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail="No se encontró un equipo con ese código."
            )

        return dict(row)


# ==========================================
# MODELO PARA BUSCAR POR SERIAL
# ==========================================

class BuscarEquipoPorSerial(BaseModel):

    serial: str = Field(
        min_length=1,
        max_length=150
    )

    id_ambiente: int | None = Field(
        default=None,
        ge=1
    )


# ==========================================
# DETECCION Y REGISTRO AUTOMATICO
# ==========================================

@router.post("/equipos/por-serial")
def obtener_equipo_por_serial(datos: BuscarEquipoPorSerial):

    serial = datos.serial.strip()

    if not serial:

        raise HTTPException(
            status_code=400,
            detail="El serial no puede estar vacío."
        )

    with get_connection() as conn, dict_cursor(conn) as cur:

        # Evitar registros simultáneos duplicados

        cur.execute(
            "SELECT pg_advisory_xact_lock(20261124)"
        )

        # Buscar primero si el serial ya existe

        cur.execute(
            """
            SELECT
                e.id_equipo,
                e.registro_unico,
                COALESCE(
                    NULLIF(TRIM(e.serial), ''),
                    e.identificador_sistema
                ) AS serial,
                e.modelo,
                e.tipo,
                e.estado::text AS estado,
                a.id_ambiente,
                a.descripcion AS ambiente,
                s.id_sede,
                s.descripcion AS sede
            FROM equipos e
            JOIN ambientes a
                ON e.id_ambiente = a.id_ambiente
            JOIN sedes s
                ON a.id_sede = s.id_sede
            WHERE
                UPPER(TRIM(e.serial)) = UPPER(%s)
                OR
                UPPER(TRIM(e.identificador_sistema)) = UPPER(%s)
            LIMIT 2
            """,
            (serial, serial)
        )

        equipos = cur.fetchall()

        if len(equipos) > 1:

            raise HTTPException(
                status_code=409,
                detail="Existen equipos duplicados con este serial."
            )

        # Si el computador ya está registrado,
        # devolver su información sin duplicarlo.

        if equipos:

            return dict(equipos[0])

        # Si es un equipo nuevo, necesitamos
        # el ambiente seleccionado por el aprendiz.

        if datos.id_ambiente is None:

            raise HTTPException(
                status_code=422,
                detail=(
                    "Debes seleccionar una sede y "
                    "un ambiente antes de continuar."
                )
            )

        # Verificar que el ambiente exista

        cur.execute(
            """
            SELECT id_ambiente
            FROM ambientes
            WHERE id_ambiente = %s
            """,
            (datos.id_ambiente,)
        )

        ambiente = cur.fetchone()

        if not ambiente:

            raise HTTPException(
                status_code=404,
                detail="El ambiente seleccionado no existe."
            )

        # Registrar automáticamente el equipo.
        # No se asigna número PC-01, PC-02, etc.
        # Ese campo pertenece a los puestos existentes.

        cur.execute(
            """
            INSERT INTO equipos (
                id_ambiente,
                serial,
                tipo,
                modelo,
                numero_etiqueta
            )
            VALUES (%s, %s, %s, %s, NULL)
            RETURNING id_equipo
            """,
            (
                datos.id_ambiente,
                serial,
                "computador",
                "Sin identificar"
            )
        )

        nuevo = cur.fetchone()
        id_equipo = nuevo["id_equipo"]

        # Crear el registro único automáticamente

        registro = f"DV-EQ-{id_equipo}"

        cur.execute(
            """
            UPDATE equipos
            SET registro_unico = %s
            WHERE id_equipo = %s
            """,
            (
                registro,
                id_equipo
            )
        )

        # Devolver los datos del computador
        # para mostrarlos en el Dashboard.

        cur.execute(
            """
            SELECT
                e.id_equipo,
                e.registro_unico,
                e.serial,
                e.modelo,
                e.tipo,
                e.estado::text AS estado,
                a.id_ambiente,
                a.descripcion AS ambiente,
                s.id_sede,
                s.descripcion AS sede
            FROM equipos e
            JOIN ambientes a
                ON e.id_ambiente = a.id_ambiente
            JOIN sedes s
                ON a.id_sede = s.id_sede
            WHERE e.id_equipo = %s
            """,
            (id_equipo,)
        )

        return dict(cur.fetchone())


# ==========================================
# OBTENER EQUIPO POR IDENTIFICADOR
# ==========================================

@router.get("/equipos/identificador")
def obtener_identificador_equipo():

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            _EQUIPOS_SQL +
            """
            WHERE e.registro_unico IS NOT NULL
            ORDER BY e.id_equipo
            LIMIT 1
            """
        )

        row = cur.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No hay equipos con registro "
                    "único configurado."
                )
            )

        return dict(row)


# ==========================================
# CONSULTAR EQUIPO DETECTADO
# ==========================================

@router.get("/equipos/detectado")
def equipo_detectado():

    # Se conserva el funcionamiento
    # utilizado para demostraciones.

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            _EQUIPOS_SQL +
            " ORDER BY e.id_equipo LIMIT 1"
        )

        row = cur.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail="Todavía no hay equipos registrados."
            )

        return dict(row)


# ==========================================
# CONFIRMAR BUEN ESTADO
# ==========================================

@router.post("/equipos/confirmar-estado")
def confirmar_estado_equipo(
    datos: ConfirmarEstadoEquipo
):

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            """
            UPDATE equipos
            SET estado = CAST(
                'buen_estado' AS estado_equipo_enum
            )
            WHERE registro_unico = %s
            RETURNING
                id_equipo,
                registro_unico,
                estado::text AS estado
            """,
            (datos.registro_unico.strip(),)
        )

        row = cur.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No existe un equipo con "
                    "ese registro único."
                )
            )

        return {
            "mensaje": "Estado del equipo confirmado.",
            "equipo": dict(row)
        }


# ==========================================
# OBTENER EQUIPO POR ID
# ==========================================

@router.get("/equipos/{id_equipo}")
def obtener_equipo(id_equipo: int):

    with get_connection() as conn, dict_cursor(conn) as cur:

        cur.execute(
            _EQUIPOS_SQL +
            " WHERE e.id_equipo = %s",
            (id_equipo,)
        )

        row = cur.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail="Equipo no encontrado."
            )

        return dict(row)


# ==========================================
# VINCULAR SERIAL A UN PUESTO EXISTENTE
# ADMINISTRADOR O TECNICO
# ==========================================

class VincularSerial(BaseModel):

    serial: str = Field(
        min_length=1,
        max_length=150
    )

    id_ambiente: int

    numero_etiqueta: int = Field(
        ge=1,
        le=30
    )


@router.post("/equipos/vincular-serial")
def vincular_serial(
    datos: VincularSerial,
    authorization: str | None = Header(default=None)
):

    if (
        not authorization
        or not authorization.startswith("Bearer ")
    ):

        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión."
        )

    token = authorization.split(" ", 1)[1]
    usuario = verify_access_token(token)

    if not usuario:

        raise HTTPException(
            status_code=401,
            detail="Sesión inválida o vencida."
        )

    serial = datos.serial.strip()

    if not serial:

        raise HTTPException(
            status_code=400,
            detail="El serial no puede estar vacío."
        )

    with get_connection() as conn, dict_cursor(conn) as cur:

        # Verificar que el usuario sea
        # administrador o técnico.

        cur.execute(
            """
            SELECT rol::text AS rol
            FROM usuarios
            WHERE id_usuario = %s
            """,
            (int(usuario["sub"]),)
        )

        usuario_bd = cur.fetchone()

        if not usuario_bd or usuario_bd["rol"] not in (
            "administrador",
            "tecnico"
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "Solo un administrador o técnico "
                    "puede vincular seriales."
                )
            )

        # Evitar vinculaciones simultáneas

        cur.execute(
            "SELECT pg_advisory_xact_lock(20261124)"
        )

        # Comprobar que el serial no exista

        cur.execute(
            """
            SELECT id_equipo
            FROM equipos
            WHERE
                UPPER(TRIM(serial)) = UPPER(%s)
                OR
                UPPER(TRIM(identificador_sistema)) = UPPER(%s)
            LIMIT 1
            """,
            (serial, serial)
        )

        if cur.fetchone():

            raise HTTPException(
                status_code=409,
                detail="Este serial ya está registrado."
            )

        # Buscar el puesto seleccionado

        cur.execute(
            """
            SELECT
                id_equipo,
                serial,
                identificador_sistema,
                registro_unico
            FROM equipos
            WHERE id_ambiente = %s
              AND numero_etiqueta = %s
            FOR UPDATE
            """,
            (
                datos.id_ambiente,
                datos.numero_etiqueta
            )
        )

        puestos = cur.fetchall()

        if not puestos:

            raise HTTPException(
                status_code=404,
                detail="No se encontró el puesto seleccionado."
            )

        if len(puestos) > 1:

            raise HTTPException(
                status_code=409,
                detail="Existen puestos duplicados en este ambiente."
            )

        equipo = puestos[0]

        if (
            equipo["serial"] is not None
            or equipo["identificador_sistema"] is not None
        ):

            raise HTTPException(
                status_code=409,
                detail="Este puesto ya tiene un serial vinculado."
            )

        # Mantener el código existente
        # o generar uno si está vacío.

        registro = (
            equipo["registro_unico"]
            or f"DV-EQ-{equipo['id_equipo']}"
        )

        # Vincular sin crear otro equipo

        cur.execute(
            """
            UPDATE equipos
            SET
                serial = %s,
                registro_unico = %s
            WHERE id_equipo = %s
              AND serial IS NULL
              AND identificador_sistema IS NULL
            RETURNING
                id_equipo,
                id_ambiente,
                numero_etiqueta,
                serial,
                registro_unico
            """,
            (
                serial,
                registro,
                equipo["id_equipo"]
            )
        )

        actualizado = cur.fetchone()

        if not actualizado:

            raise HTTPException(
                status_code=409,
                detail="El computador ya fue vinculado."
            )

        return {
            "mensaje": "Serial vinculado correctamente.",
            "equipo": dict(actualizado)
        }
