import base64
import hashlib
import hmac
import json
import secrets
import time
from app.config import SECRET_KEY

_ITERATIONS = 310_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        _ITERATIONS,
        base64.urlsafe_b64encode(salt).decode().rstrip("="),
        base64.urlsafe_b64encode(digest).decode().rstrip("="),
    )


def verify_password(password: str, stored: str) -> bool:
    if stored.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt_text, digest_text = stored.split("$", 3)
            salt = base64.urlsafe_b64decode(salt_text + "=" * (-len(salt_text) % 4))
            expected = base64.urlsafe_b64decode(digest_text + "=" * (-len(digest_text) % 4))
            actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
            return hmac.compare_digest(actual, expected)
        except (ValueError, TypeError):
            return False
    # Compatibilidad temporal con usuarios antiguos guardados en texto plano.
    # Si el acceso funciona, auth.py reemplaza el valor por un hash.
    return hmac.compare_digest(password, stored)


def create_access_token(user: dict, expires_minutes: int = 60) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user["id_usuario"]),
        "rol": user["rol"],
        "iat": now,
        "exp": now + expires_minutes * 60,
    }
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
    sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{body}.{sig}"


def verify_access_token(token: str):
    try:
        partes = token.split(".")

        if len(partes) != 2:
            return None

        body, firma = partes

        firma_esperada = hmac.new(
            SECRET_KEY.encode(),
            body.encode(),
            hashlib.sha256
        ).digest()

        firma_recibida = base64.urlsafe_b64decode(
            firma + "=" * (-len(firma) % 4)
        )

        if not hmac.compare_digest(
            firma_recibida, firma_esperada
        ):
            return None

        contenido = base64.urlsafe_b64decode(
            body + "=" * (-len(body) % 4)
        )

        datos = json.loads(contenido)

        if not isinstance(datos, dict):
            return None

        if int(datos["exp"]) <= int(time.time()):
            return None

        if int(datos["sub"]) <= 0:
            return None

        return datos

    except (ValueError, TypeError, KeyError, OverflowError):
        return None
