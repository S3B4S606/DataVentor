
import json
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Frontends autorizados para consultar el detector local.
ORIGENES_PERMITIDOS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}


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
        timeout=8,
        check=True
    )

    serial = resultado.stdout.strip()

    if not serial:
        raise ValueError("No se pudo obtener el serial")

    return serial


class DetectorHandler(BaseHTTPRequestHandler):

    def enviar_respuesta(self, codigo, datos):
        contenido = json.dumps(datos).encode("utf-8")
        origen = self.headers.get("Origin", "")

        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")

        if origen in ORIGENES_PERMITIDOS:
            self.send_header("Access-Control-Allow-Origin", origen)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header(
                "Access-Control-Allow-Private-Network", "true"
            )

        self.send_header("Content-Length", str(len(contenido)))
        self.end_headers()
        self.wfile.write(contenido)

    def do_OPTIONS(self):
        if self.headers.get("Origin") not in ORIGENES_PERMITIDOS:
            self.enviar_respuesta(403, {"error": "Origen no permitido"})
            return

        self.enviar_respuesta(204, {})

    def do_GET(self):
        if self.headers.get("Origin") not in ORIGENES_PERMITIDOS:
            self.enviar_respuesta(403, {"error": "Origen no permitido"})
            return

        if self.path != "/identidad":
            self.enviar_respuesta(404, {"error": "Ruta no encontrada"})
            return

        try:
            serial = obtener_serial()
            self.enviar_respuesta(200, {"serial": serial})

        except Exception:
            self.enviar_respuesta(
                503,
                {"error": "No fue posible leer el serial"}
            )


if __name__ == "__main__":
    servidor = ThreadingHTTPServer(
        ("127.0.0.1", 8765),
        DetectorHandler
    )

    print("Detector DataVentor iniciado correctamente")
    print("Dirección: http://127.0.0.1:8765")

    servidor.serve_forever()
