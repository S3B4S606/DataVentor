
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaLock, FaCheckCircle } from "react-icons/fa";

import "../../styles/AdminCoordinador/RestablecerContrasena.css";

function RestablecerContrasena() {
  const navigate = useNavigate();
  const [parametros] = useSearchParams();

  const token = parametros.get("token") || "";

  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const cambiarContrasena = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace de recuperación no es válido.");
      return;
    }

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const controlador = new AbortController();
    const tiempoLimite = setTimeout(
      () => controlador.abort(),
      15000
    );

    try {
      const respuesta = await fetch(
        `${import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"}/api/recuperar-contrasena/restablecer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            nueva_contrasena: contrasena,
          }),
          signal: controlador.signal,
        }
      );

      if (!respuesta.ok) {
        const datos = await respuesta.json();

        throw new Error(
          typeof datos.detail === "string"
            ? datos.detail
            : "No se pudo cambiar la contraseña."
        );
      }

      setExito(true);
      setContrasena("");
      setConfirmar("");

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError(
          "El servidor tardó demasiado en responder."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible conectar con DataVentor."
        );
      }
    } finally {
      clearTimeout(tiempoLimite);
      setCargando(false);
    }
  };

  return (
    <div className="restablecer-page">
      <header className="restablecer-header">
        <div className="restablecer-logo">
          <strong>
            Data<span>Ventor</span>
          </strong>
          <small>
            Gestión de equipos en ambientes SENA
          </small>
        </div>

        <button
          type="button"
          className="restablecer-volver"
          onClick={() => navigate("/login-coordinador")}
        >
          <FaArrowLeft />
          Volver
        </button>
      </header>

      <main className="restablecer-content">
        <section className="restablecer-card">

          <div className="restablecer-icon">
            {exito ? <FaCheckCircle /> : <FaLock />}
          </div>

          {exito ? (
            <>
              <h1>¡Contraseña actualizada!</h1>

              <p className="restablecer-subtitle">
                Tu contraseña de DataVentor se cambió
                correctamente. Ya puedes iniciar sesión.
              </p>

              <button
                type="button"
                className="restablecer-boton"
                onClick={() => navigate("/login-coordinador")}
              >
                Ir al inicio de sesión
              </button>
            </>
          ) : (
            <>
              <h1>Nueva contraseña</h1>

              <p className="restablecer-subtitle">
                Crea una nueva contraseña para ingresar
                a tu cuenta de DataVentor.
              </p>

              {!token ? (
                <div
                  className="restablecer-error"
                  role="alert"
                >
                  Este enlace no es válido. Solicita uno nuevo
                  desde la pantalla de recuperación.
                </div>
              ) : (
                <form onSubmit={cambiarContrasena}>

                  <div className="restablecer-grupo">
                    <label htmlFor="nuevaContrasena">
                      Nueva contraseña
                    </label>

                    <div className="restablecer-input">
                      <FaLock />
                      <input
                        id="nuevaContrasena"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={contrasena}
                        onChange={(e) =>
                          setContrasena(e.target.value)
                        }
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div className="restablecer-grupo">
                    <label htmlFor="confirmarContrasena">
                      Confirmar nueva contraseña
                    </label>

                    <div className="restablecer-input">
                      <FaLock />
                      <input
                        id="confirmarContrasena"
                        type="password"
                        placeholder="Repite tu contraseña"
                        value={confirmar}
                        onChange={(e) =>
                          setConfirmar(e.target.value)
                        }
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      className="restablecer-error"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    className="restablecer-boton"
                    type="submit"
                    disabled={cargando}
                  >
                    {cargando
                      ? "Guardando contraseña..."
                      : "Cambiar contraseña"}
                  </button>
                </form>
              )}

              <button
                type="button"
                className="restablecer-regresar"
                onClick={() => navigate("/login-coordinador")}
              >
                Volver al inicio de sesión
              </button>
            </>
          )}
        </section>
      </main>

      <footer className="restablecer-footer">
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

export default RestablecerContrasena;
