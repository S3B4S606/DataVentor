
import json
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


# Páginas autorizadas para consultar el detector
ORIGENES_PERMITIDOS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://data-ventor.vercel.app",
}


# ==========================================
# OBTENER SERIAL DE WINDOWS
# ==========================================

def obtener_serial():
    comando = [
        "powershell.exe",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "(Get-CimInstance -ClassName Win32_BIOS).SerialNumber"
    ]

    resultado = subprocess.run(
        comando,
        capture_output=True,
        text=True,
        timeout=15,
        check=True
    )

    serial = resultado.stdout.strip()

    if not serial:
        raise ValueError("Windows no devolvió un serial")

    return serial


# ==========================================
# SERVIDOR LOCAL
# ==========================================

class DetectorHandler(BaseHTTPRequestHandler):

    def enviar_respuesta(self, codigo, datos):
        contenido = json.dumps(
            datos,
            ensure_ascii=False
        ).encode("utf-8")

        origen = self.headers.get("Origin")

        self.send_response(codigo)
        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )
        self.send_header("Cache-Control", "no-store")

        if origen in ORIGENES_PERMITIDOS:
            self.send_header("Access-Control-Allow-Origin", origen)
            self.send_header("Vary", "Origin")
            self.send_header(
                "Access-Control-Allow-Methods",
                "GET, OPTIONS"
            )
            self.send_header(
                "Access-Control-Allow-Private-Network",
                "true"
            )

        self.send_header(
            "Content-Length",
            str(len(contenido))
        )

        self.end_headers()
        self.wfile.write(contenido)
        self.wfile.flush()

    def do_OPTIONS(self):
        origen = self.headers.get("Origin")

        if origen not in ORIGENES_PERMITIDOS:
            self.enviar_respuesta(
                403,
                {"error": "Origen no permitido"}
            )
            return

        self.enviar_respuesta(200, {"estado": "ok"})

    def do_GET(self):
        origen = self.headers.get("Origin")

        # Permitir abrir la dirección directamente
        # desde el mismo computador.
        # Rechazar páginas web no autorizadas.

        if origen and origen not in ORIGENES_PERMITIDOS:
            self.enviar_respuesta(
                403,
                {"error": "Origen no permitido"}
            )
            return

        ruta = urlsplit(self.path).path

        if ruta != "/identidad":
            self.enviar_respuesta(
                404,
                {"error": "Ruta no encontrada"}
            )
            return

        try:
            serial = obtener_serial()

            self.enviar_respuesta(
                200,
                {"serial": serial}
            )

        except Exception as error:
            print(
                "Error al obtener el serial:",
                repr(error),
                flush=True
            )

            self.enviar_respuesta(
                503,
                {"error": "No fue posible leer el serial"}
            )


# ==========================================
# INICIAR DETECTOR
# ==========================================

if __name__ == "__main__":
    servidor = ThreadingHTTPServer(
        ("127.0.0.1", 8765),
        DetectorHandler
    )

    print(
        "Detector DataVentor iniciado correctamente",
        flush=True
    )

    print(
        "Dirección: http://127.0.0.1:8765",
        flush=True
    )

    servidor.serve_forever()
