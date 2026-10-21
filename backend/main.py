from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg2 import OperationalError
from app.config import FRONTEND_ORIGINS
from app.database import get_connection, dict_cursor
from app.routers.auth import router as auth_router
from app.routers.catalogos import router as catalogos_router
from app.routers.reportes import router as reportes_router

app = FastAPI(
    title="DataVentor API",
    version="2.0.0",
    description="API para la gestión de usuarios, sedes, ambientes, equipos y reportes de DataVentor.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(catalogos_router)
app.include_router(reportes_router)


@app.get("/", tags=["Sistema"])
def inicio():
    return {"mensaje": "Backend de DataVentor con FastAPI", "documentacion": "/docs", "version": app.version}


@app.get("/api/salud", tags=["Sistema"])
def salud():
    try:
        with get_connection() as conn, dict_cursor(conn) as cur:
            cur.execute("SELECT 1 AS conectado")
            cur.fetchone()
        return {"estado": "ok", "base_datos": "conectada", "backend": "FastAPI"}
    except OperationalError:
        return JSONResponse(status_code=503, content={"estado": "error", "base_datos": "no_conectada", "backend": "FastAPI", "mensaje": "No fue posible conectar con PostgreSQL. Revisa el archivo .env."})


@app.get("/api/inicio", tags=["Sistema"])
def api_inicio():
    return {
        "mensaje": "Bienvenido a DataVentor",
        "estado": "ok",
        "roles": [
            {"nombre": "Administrador", "ruta": "/dashboard-admin"},
            {"nombre": "Coordinador", "ruta": "/login-coordinador"},
            {"nombre": "Instructor", "ruta": "/login-instructor"},
            {"nombre": "Aprendiz", "ruta": "/dashboard-aprendiz"},
            {"nombre": "Técnico", "ruta": "/dashboard-tecnico"},
        ],
    }


@app.exception_handler(HTTPException)
async def error_http(request: Request, exc: HTTPException):
    mensaje = exc.detail if isinstance(exc.detail, str) else "La petición no pudo procesarse."
    return JSONResponse(status_code=exc.status_code, content={"mensaje": mensaje})


@app.exception_handler(RequestValidationError)
async def error_validacion(request: Request, exc: RequestValidationError):
    errores = []
    for error in exc.errors():
        campo = ".".join(str(p) for p in error.get("loc", []) if p != "body")
        errores.append(f"{campo}: {error.get('msg', 'dato inválido')}" if campo else error.get("msg", "Dato inválido"))
    return JSONResponse(status_code=422, content={"mensaje": "Revisa los datos enviados.", "errores": errores})


@app.exception_handler(Exception)
async def error_no_controlado(request: Request, exc: Exception):
    # No exponemos credenciales ni trazas internas al navegador.
    return JSONResponse(status_code=500, content={"mensaje": "Se produjo un error interno en el backend."})
