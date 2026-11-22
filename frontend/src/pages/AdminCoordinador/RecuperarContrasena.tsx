
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaLock } from "react-icons/fa";

import "../../styles/AdminCoordinador/RecuperarContrasena.css";

function RecuperarContrasena() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const recuperar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMensaje("");

    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setCargando(true);

    const controlador = new AbortController();
    const tiempoLimite = setTimeout(() => controlador.abort(), 15000);

    try {
      const respuesta = await fetch(
        "http://127.0.0.1:5000/api/recuperar-contrasena/solicitar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: correoLimpio,
          }),
          signal: controlador.signal,
        }
      );

      if (!respuesta.ok) {
        let detalle = "No fue posible procesar la solicitud.";

        try {
          const datos = await respuesta.json();

          if (typeof datos.detail === "string") {
            detalle = datos.detail;
          }
        } catch {
          // Mostrar mensaje general si no llega JSON.
        }

        throw new Error(detalle);
      }

      setMensaje(
        "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña."
      );

    } catch (err) {
      console.error("Error al solicitar recuperación:", err);

      if (err instanceof Error && err.name === "AbortError") {
        setError(
          "El servidor tardó demasiado en responder. Inténtalo nuevamente."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No fue posible conectar con DataVentor.");
      }

    } finally {
      clearTimeout(tiempoLimite);
      setCargando(false);
    }
  };

  return (
    <div className="recuperar-page">
      <header className="recuperar-header">
        <div className="recuperar-logo">
          <strong>
            Data<span>Ventor</span>
          </strong>
          <small>Gestión de equipos en ambientes SENA</small>
        </div>

        <button
          type="button"
          className="recuperar-volver"
          onClick={() => navigate("/login-coordinador")}
        >
          <FaArrowLeft />
          Volver
        </button>
      </header>

      <main className="recuperar-content">
        <section className="recuperar-card">
          <div className="recuperar-icon">
            <FaLock />
          </div>

          <h1>Recuperar contraseña</h1>

          <p className="recuperar-subtitle">
            Ingresa tu correo electrónico registrado en DataVentor
            para solicitar un enlace de recuperación de contraseña.
          </p>

          <form onSubmit={recuperar}>
            <div className="recuperar-grupo">
              <label htmlFor="correoRecuperacion">
                Correo electrónico
              </label>

              <div className="recuperar-input">
                <FaEnvelope />

                <input
                  id="correoRecuperacion"
                  type="email"
                  placeholder="usuario@soy.sena.edu.co"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="recuperar-error" role="alert">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="recuperar-exito" role="status">
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              className="recuperar-boton"
              disabled={cargando}
            >
              {cargando
                ? "Enviando solicitud..."
                : "Enviar enlace de recuperación"}
            </button>
          </form>

          <button
            type="button"
            className="recuperar-regresar"
            onClick={() => navigate("/login-coordinador")}
          >
            Volver al inicio de sesión
          </button>
        </section>
      </main>

      <footer className="recuperar-footer">
        <div>
          <strong>DataVentor</strong>
          <small>Conocimiento que transforma</small>
        </div>

        <div>
          <strong>SENA</strong>
          <small>
            Centro de Gestión de Mercados,
            Logística y Tecnologías de la Información
          </small>
        </div>
      </footer>
    </div>
  );
}

export default RecuperarContrasena;
