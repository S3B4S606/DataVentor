
import os
import secrets
import hashlib
import smtplib

from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from urllib.parse import quote

from pydantic import BaseModel

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


# ==========================================
# REGISTRO DE USUARIOS
# ==========================================

@router.post("/registro", status_code=201)
def registrar(datos: RegistroUsuario):
    rol = "administrador" if datos.rol == "coordinador" else datos.rol

    try:
        with get_connection() as conn, dict_cursor(conn) as cur:
            cur.execute("SELECT pg_advisory_xact_lock(20261020)")
            cur.execute(
                "SELECT COALESCE(MAX(id_usuario), 0) + 1 AS nuevo_id FROM usuarios"
            )
            nuevo_id = cur.fetchone()["nuevo_id"]

            cur.execute(
                """INSERT INTO usuarios
                   (id_usuario, nombre, apellido, tipo_documento, documento,
                    correo, contrasena, telefono, rol)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CAST(%s AS rol_enum))
                   RETURNING id_usuario, nombre, apellido, tipo_documento,
                             documento, correo, rol, fecha_registro""",
                (
                    nuevo_id,
                    datos.nombre,
                    datos.apellido,
                    datos.tipo_documento,
                    datos.documento,
                    str(datos.correo).lower(),
                    hash_password(datos.contrasena),
                    datos.telefono,
                    rol,
                ),
            )

            user = dict(cur.fetchone())

        return {
            "mensaje": "Usuario registrado correctamente.",
            "usuario": _public_user(user),
        }

    except IntegrityError as exc:
        constraint = getattr(
            getattr(exc, "diag", None), "constraint_name", ""
        ) or ""

        if "correo" in constraint:
            raise HTTPException(
                status_code=409,
                detail="Ese correo ya está registrado."
            )

        if "documento" in constraint:
            raise HTTPException(
                status_code=409,
                detail="Ese documento ya está registrado."
            )

        raise HTTPException(
            status_code=409,
            detail="No se pudo registrar el usuario por un dato duplicado o una relación inválida."
        )


# ==========================================
# INICIO DE SESIÓN
# ==========================================

@router.post("/login")
def login(datos: LoginUsuario):
    if not datos.documento and not datos.correo:
        raise HTTPException(
            status_code=422,
            detail="Indica el documento o el correo."
        )

    with get_connection() as conn, dict_cursor(conn) as cur:

        if datos.documento:
            if datos.tipo_documento:
                cur.execute(
                    """SELECT * FROM usuarios
                       WHERE documento = %s
                       AND tipo_documento = %s
                       LIMIT 1""",
                    (
                        datos.documento.strip(),
                        datos.tipo_documento.strip()
                    ),
                )
            else:
                cur.execute(
                    "SELECT * FROM usuarios WHERE documento = %s LIMIT 1",
                    (datos.documento.strip(),),
                )
        else:
            cur.execute(
                """SELECT * FROM usuarios
                   WHERE lower(correo) = lower(%s)
                   LIMIT 1""",
                (str(datos.correo),),
            )

        row = cur.fetchone()

        if row and (
            row["documento"] == "SISTEMA-REPORTES"
            or row["correo"].lower() == "reportes.sistema@dataventor.invalid"
        ):
            raise HTTPException(
                status_code=401,
                detail="Documento/correo o contraseña incorrectos."
            )

        if not row or not verify_password(
            datos.contrasena, row["contrasena"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Documento/correo o contraseña incorrectos."
            )

        if not row["contrasena"].startswith("pbkdf2_sha256$"):
            cur.execute(
                """UPDATE usuarios
                   SET contrasena = %s
                   WHERE id_usuario = %s""",
                (
                    hash_password(datos.contrasena),
                    row["id_usuario"]
                ),
            )

        user = dict(row)

    public_user = _public_user(user)

    return {
        "mensaje": "Inicio de sesión correcto.",
        "usuario": public_user,
        "token": create_access_token(public_user),
    }


# ==========================================
# RECUPERACIÓN DE CONTRASEÑAS
# ==========================================

class SolicitarRecuperacion(BaseModel):
    correo: str


class RestablecerContrasena(BaseModel):
    token: str
    nueva_contrasena: str


# ==========================================
# ENVIAR CORREO DE RECUPERACIÓN
# ==========================================

def enviar_correo(destinatario, enlace):
    usuario = os.getenv("SMTP_USER")
    contrasena = os.getenv("SMTP_PASSWORD")
    remitente = os.getenv("SMTP_FROM") or usuario
    servidor = os.getenv("SMTP_HOST", "smtp.gmail.com")
    puerto = int(os.getenv("SMTP_PORT", "465"))

    if not usuario or not contrasena:
        raise RuntimeError("No se ha configurado el correo de DataVentor.")

    mensaje = EmailMessage()
    mensaje["Subject"] = "Recuperación de contraseña - DataVentor"
    mensaje["From"] = remitente
    mensaje["To"] = destinatario

    mensaje.set_content(
        "Hola,\n\n"
        "Recibimos una solicitud para recuperar tu contraseña.\n\n"
        f"Abre este enlace para establecer una nueva contraseña:\n{enlace}\n\n"
        "El enlace vence en 30 minutos y solo puede utilizarse una vez.\n"
        "Si no solicitaste este cambio, ignora este mensaje."
    )

    # CONEXIÓN SEGURA CON GMAIL - PUERTO 465
    print("SMTP: Iniciando conexión SSL")

    with smtplib.SMTP_SSL(servidor, puerto, timeout=20) as smtp:
        print("SMTP: Conexión SSL establecida")

        smtp.login(usuario, contrasena)
        print("SMTP: Autenticación correcta")

        smtp.send_message(mensaje)
        print("SMTP: Correo enviado")


# ==========================================
# SOLICITAR RECUPERACIÓN
# ==========================================

@router.post("/recuperar-contrasena/solicitar")
def solicitar_recuperacion(datos: SolicitarRecuperacion):
    correo = datos.correo.strip().lower()

    if not correo or "@" not in correo:
        raise HTTPException(
            status_code=422,
            detail="Ingresa un correo electrónico válido."
        )

    mensaje_publico = {
        "mensaje": "Si el correo está registrado, recibirás un enlace de recuperación."
    }

    try:
        with get_connection() as conn, dict_cursor(conn) as cur:
            cur.execute(
                """
                SELECT id_usuario, documento, correo
                FROM usuarios
                WHERE lower(correo) = %s
                LIMIT 1
                """,
                (correo,)
            )

            usuario = cur.fetchone()

            if not usuario:
                return mensaje_publico

            if usuario["documento"] == "SISTEMA-REPORTES":
                return mensaje_publico

            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode()).hexdigest()

            ahora = datetime.now(timezone.utc).replace(tzinfo=None)
            vencimiento = ahora + timedelta(minutes=30)

            cur.execute(
                """
                UPDATE recuperacion_contrasenas
                SET utilizado = TRUE
                WHERE id_usuario = %s AND utilizado = FALSE
                """,
                (usuario["id_usuario"],)
            )

            cur.execute(
                """
                INSERT INTO recuperacion_contrasenas
                (id_usuario, token_hash, fecha_expiracion)
                VALUES (%s, %s, %s)
                """,
                (usuario["id_usuario"], token_hash, vencimiento)
            )

            frontend = os.getenv(
                "FRONTEND_URL",
                "http://localhost:5173"
            ).rstrip("/")

            enlace = (
                f"{frontend}/restablecer-contrasena"
                f"?token={quote(token)}"
            )

            enviar_correo(usuario["correo"], enlace)

    except Exception as error:
        print("ERROR EN RECUPERACIÓN:", type(error).__name__)

        raise HTTPException(
            status_code=503,
            detail="No fue posible procesar la solicitud de recuperación."
        )

    return mensaje_publico


# ==========================================
# RESTABLECER CONTRASEÑA
# ==========================================

@router.post("/recuperar-contrasena/restablecer")
def restablecer_contrasena(datos: RestablecerContrasena):
    if len(datos.nueva_contrasena) < 8:
        raise HTTPException(
            status_code=422,
            detail="La contraseña debe tener al menos 8 caracteres."
        )

    token_hash = hashlib.sha256(
        datos.token.encode()
    ).hexdigest()

    ahora = datetime.now(timezone.utc).replace(tzinfo=None)

    with get_connection() as conn, dict_cursor(conn) as cur:
        cur.execute(
            """
            SELECT id_recuperacion, id_usuario
            FROM recuperacion_contrasenas
            WHERE token_hash = %s
              AND utilizado = FALSE
              AND fecha_expiracion > %s
            FOR UPDATE
            """,
            (token_hash, ahora)
        )

        recuperacion = cur.fetchone()

        if not recuperacion:
            raise HTTPException(
                status_code=400,
                detail="El enlace es inválido o ha vencido."
            )

        cur.execute(
            """
            UPDATE usuarios
            SET contrasena = %s
            WHERE id_usuario = %s
            """,
            (
                hash_password(datos.nueva_contrasena),
                recuperacion["id_usuario"]
            )
        )

        cur.execute(
            """
            UPDATE recuperacion_contrasenas
            SET utilizado = TRUE
            WHERE id_usuario = %s
            """,
            (recuperacion["id_usuario"],)
        )

    return {
        "mensaje": "Contraseña actualizada correctamente."
    }
