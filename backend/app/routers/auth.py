from fastapi import APIRouter, HTTPException
from psycopg2 import IntegrityError
from app.database import get_connection, dict_cursor
from app.schemas import RegistroUsuario, LoginUsuario
from app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api", tags=["Autenticación"])


def _public_user(row):
    return {
        "id_usuario": row["id_usuario"],
        "nombre": row["nombre"],
        "apellido": row["apellido"],
        "tipo_documento": row.get("tipo_documento"),
        "documento": row.get("documento"),
        "correo": row["correo"],
        "rol": row["rol"],
        "fecha_registro": row.get("fecha_registro"),
    }


@router.post("/registro", status_code=201)
def registrar(datos: RegistroUsuario):
    rol = "administrador" if datos.rol == "coordinador" else datos.rol
    try:
        with get_connection() as conn, dict_cursor(conn) as cur:
            # La base de datos actual tiene id_usuario sin autoincremento.
            cur.execute("SELECT pg_advisory_xact_lock(20261020)")
            cur.execute("SELECT COALESCE(MAX(id_usuario), 0) + 1 AS nuevo_id FROM usuarios")
            nuevo_id = cur.fetchone()["nuevo_id"]
            cur.execute(
                """INSERT INTO usuarios
                   (id_usuario, nombre, apellido, tipo_documento, documento,
                    correo, contrasena, telefono, rol)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CAST(%s AS rol_enum))
                   RETURNING id_usuario, nombre, apellido, tipo_documento,
                             documento, correo, rol, fecha_registro""",
                (nuevo_id, datos.nombre, datos.apellido, datos.tipo_documento,
                 datos.documento, str(datos.correo).lower(), hash_password(datos.contrasena),
                 datos.telefono, rol),
            )
            user = dict(cur.fetchone())
        return {"mensaje": "Usuario registrado correctamente.", "usuario": _public_user(user)}
    except IntegrityError as exc:
        constraint = getattr(getattr(exc, "diag", None), "constraint_name", "")
        if "correo" in constraint:
            raise HTTPException(status_code=409, detail="Ese correo ya está registrado.")
        if "documento" in constraint:
            raise HTTPException(status_code=409, detail="Ese documento ya está registrado.")
        raise HTTPException(status_code=409, detail="No se pudo registrar el usuario por un dato duplicado o una relación inválida.")


@router.post("/login")
def login(datos: LoginUsuario):
    if not datos.documento and not datos.correo:
        raise HTTPException(status_code=422, detail="Indica el documento o el correo.")
    with get_connection() as conn, dict_cursor(conn) as cur:
        if datos.documento:
            if datos.tipo_documento:
                cur.execute(
                    """SELECT * FROM usuarios WHERE documento = %s
                       AND tipo_documento = %s LIMIT 1""",
                    (datos.documento.strip(), datos.tipo_documento.strip()),
                )
            else:
                cur.execute("SELECT * FROM usuarios WHERE documento = %s LIMIT 1", (datos.documento.strip(),))
        else:
            cur.execute("SELECT * FROM usuarios WHERE lower(correo) = lower(%s) LIMIT 1", (str(datos.correo),))
        row = cur.fetchone()
        if not row or not verify_password(datos.contrasena, row["contrasena"]):
            raise HTTPException(status_code=401, detail="Documento/correo o contraseña incorrectos.")
        # Migra automáticamente contraseñas antiguas en texto plano al primer inicio de sesión.
        if not row["contrasena"].startswith("pbkdf2_sha256$"):
            cur.execute("UPDATE usuarios SET contrasena = %s WHERE id_usuario = %s", (hash_password(datos.contrasena), row["id_usuario"]))
        user = dict(row)
    public_user = _public_user(user)
    return {"mensaje": "Inicio de sesión correcto.", "usuario": public_user, "token": create_access_token(public_user)}
