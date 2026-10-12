
from flask import Flask, jsonify
from flask_cors import CORS
from psycopg import Error
from conexion import obtener_conexion

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]
    }
})


@app.get("/")
def inicio():
    return jsonify({
        "mensaje": "Backend de DataVentor funcionando"
    })


@app.get("/api/salud")
def comprobar_conexion():
    try:
        with obtener_conexion() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(
                    "SELECT current_database() AS base_datos"
                )
                resultado = cursor.fetchone()

        return jsonify({
            "estado": "correcto",
            "base_datos": resultado["base_datos"]
        }), 200

    except (Error, TypeError):
        app.logger.exception("Error al conectar con PostgreSQL")
        return jsonify({
            "estado": "error",
            "mensaje": "No fue posible conectar con PostgreSQL. Revisa la configuración."
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
