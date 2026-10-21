# DataVentor — backend nuevo (FastAPI + PostgreSQL)

Este backend se preparó tomando como referencia las rutas, los campos y las llamadas HTTP que aparecen en `DataVentorNuevo/DataVentor/frontend/src`. No reutiliza el backend anterior.

## Requisitos

- Python 3.11 o superior recomendado.
- PostgreSQL encendido y una base de datos llamada `dataventor`.
- Las tablas del modelo DataVentor: `usuarios`, `sedes`, `ambientes`, `equipos`, `reportes`, `historial_estados` y, opcionalmente, `jornada`.

## Instalación en Windows / PowerShell

Desde esta carpeta del backend:

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
```

Edita `.env` con los datos de tu PostgreSQL. No compartas ese archivo ni subas sus credenciales a GitHub.

## Arranque

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

Abre:

- `http://127.0.0.1:5000/`
- `http://127.0.0.1:5000/api/salud`
- `http://127.0.0.1:5000/docs`

## Rutas implementadas

- `GET /api/salud`, `GET /api/inicio`
- `POST /api/registro`, `POST /api/login`
- `GET /api/sedes`, `GET /api/ambientes`, `POST /api/ambientes`
- `GET /api/equipos`, `GET /api/equipos/{id_equipo}`
- `GET /api/equipos/identificador`, `GET /api/equipos/detectado`, `POST /api/equipos/confirmar-estado`
- `GET /api/reportes`, `POST /api/reportes`, `GET /api/reportes/{id_reporte}`
- `PUT /api/reportes/{id_reporte}/estado`, `GET /api/reportes/{id_reporte}/historial`

Los listados de equipos y reportes incluyen aliases como `estado_equipo`, `ambiente` y `sede` que usan las pantallas del frontend.

## Importante sobre el frontend actual

En `src/pages/AdminCoordinador/DashboardAdmin.tsx` y `src/pages/AdminCoordinador/DashboardAmbientes.tsx` el frontend apunta a `http://127.0.0.1:5001`, mientras que `src/services/api.ts` y otras páginas apuntan al puerto `5000`. Para que todas las pantallas usen este backend, cambia esas dos constantes `API_URL` a `http://127.0.0.1:5000`.

Algunas pantallas del frontend actual todavía tienen formularios simulados en el cliente (por ejemplo, crear reporte y registrar ambiente). El backend ya ofrece las rutas necesarias, pero esos formularios deberán llamar a dichas rutas para persistir los datos.

## Compatibilidad con la base de datos existente

El backend consulta los nombres de tablas y columnas del esquema DataVentor existente. Como `id_usuario`, `id_ambiente` e `id_equipo` pueden no tener autoincremento en la base actual, al registrar usuarios o ambientes calcula el siguiente ID bajo un bloqueo transaccional.

No ejecutes un script SQL que contenga `DROP TABLE` o `DROP TYPE` sobre tu base de datos con información. Este paquete no ejecuta migraciones destructivas automáticamente.

## Notas de seguridad y alcance

- Las contraseñas nuevas se almacenan con PBKDF2-HMAC-SHA256, no en texto plano.
- Para compatibilidad, si un usuario antiguo tiene la contraseña en texto plano, se transforma a hash al iniciar sesión correctamente.
- El login devuelve un token firmado; las pantallas actuales no envían el token en todas sus peticiones, por lo que antes de usarlo en producción deben conectarse las comprobaciones de autenticación y autorización por rol en todas las rutas.
- `/api/equipos/detectado` devuelve el primer equipo disponible como comportamiento provisional porque la pantalla actual no envía un identificador del equipo detectado. Para un sistema real se debe definir el mecanismo de identificación del equipo.
