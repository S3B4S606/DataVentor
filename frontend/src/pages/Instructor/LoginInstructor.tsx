
import { useState } from "react";
import type { FormEvent } from "react";

import {
  FaArrowLeft,
  FaIdCard,
  FaLock,
  FaChalkboardTeacher,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import "../../styles/Instructor/LoginInstructor.css";

function LoginInstructor() {
  const navigate = useNavigate();

  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] =
    useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  const ingresar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (cargando) return;

    setError("");

    if (!tipoDocumento) {
      setError("Selecciona el tipo de documento.");
      return;
    }

    if (!numeroDocumento.trim()) {
      setError("Ingresa tu número de documento.");
      return;
    }

    if (!/^\d+$/.test(numeroDocumento.trim())) {
      setError("El documento solo debe contener números.");
      return;
    }

    if (!contrasena.trim()) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo_documento: tipoDocumento,
            documento: numeroDocumento.trim(),
            contrasena: contrasena,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          typeof datos.detail === "string"
            ? datos.detail
            : typeof datos.mensaje === "string"
            ? datos.mensaje
            : "No fue posible iniciar sesión."
        );
        return;
      }

      // Verificar que sea instructor

      if (
        datos.usuario?.rol !== "instructor" ||
        !datos.usuario?.id_usuario ||
        !datos.token
      ) {
        setError(
          "No se pudo validar el acceso como Instructor."
        );
        return;
      }

      // Guardar sesión

      localStorage.setItem(
        "usuario",
        JSON.stringify(datos.usuario)
      );

      localStorage.setItem("token", datos.token);
      localStorage.setItem("rol", "instructor");

      localStorage.setItem(
        "tipoDocumentoInstructor",
        tipoDocumento
      );

      localStorage.setItem(
        "numeroDocumentoInstructor",
        numeroDocumento.trim()
      );

      // Ir al Dashboard del Instructor

      navigate("/dashboard-instructor", {
        replace: true,
      });
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError("No fue posible conectar con el backend.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-instructor">
      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <header className="login-instructor-header">
        <div className="login-instructor-logo">
          <strong>
            Data<span>Ventor</span>
          </strong>

          <small>
            Gestión de equipos en ambientes SENA
          </small>
        </div>

        <button
          type="button"
          className="login-instructor-back"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft aria-hidden="true" />
          <span>Volver</span>
        </button>
      </header>

      {/* ======================================
          CONTENIDO PRINCIPAL
      ====================================== */}

      <main className="login-instructor-content">
        <section className="login-instructor-card">
          {/* ICONO */}

          <div
            className="login-instructor-icon"
            aria-hidden="true"
          >
            <FaChalkboardTeacher />
          </div>

          {/* TÍTULO */}

          <h1>Inicio de sesión</h1>

          <p className="login-instructor-subtitle">
            Ingresa tus datos para continuar como
            Instructor.
          </p>

          {/* FORMULARIO */}

          <form onSubmit={ingresar}>
            {/* TIPO DE DOCUMENTO */}

            <div className="login-instructor-group">
              <label htmlFor="tipoDocumentoInstructor">
                Tipo de documento
              </label>

              <div className="login-instructor-input">
                <FaIdCard aria-hidden="true" />

                <select
                  id="tipoDocumentoInstructor"
                  value={tipoDocumento}
                  onChange={(e) =>
                    setTipoDocumento(e.target.value)
                  }
                  disabled={cargando}
                  required
                >
                  <option value="">
                    Selecciona una opción
                  </option>

                  <option value="CC">
                    Cédula de ciudadanía
                  </option>

                  <option value="CE">
                    Cédula de extranjería
                  </option>
                </select>
              </div>
            </div>

            {/* NÚMERO DE DOCUMENTO */}

            <div className="login-instructor-group">
              <label htmlFor="numeroDocumentoInstructor">
                Número de documento
              </label>

              <div className="login-instructor-input">
                <FaIdCard aria-hidden="true" />

                <input
                  id="numeroDocumentoInstructor"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="Ingresa tu número de documento"
                  value={numeroDocumento}
                  onChange={(e) =>
                    setNumeroDocumento(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  disabled={cargando}
                  required
                />
              </div>
            </div>

            {/* CONTRASEÑA */}

            <div className="login-instructor-group">
              <label htmlFor="contrasenaInstructor">
                Contraseña
              </label>

              <div className="login-instructor-input">
                <FaLock aria-hidden="true" />

                <input
                  id="contrasenaInstructor"
                  type={
                    mostrarContrasena
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(e) =>
                    setContrasena(e.target.value)
                  }
                  disabled={cargando}
                  required
                />

                <button
                  type="button"
                  className="login-instructor-toggle-password"
                  onClick={() =>
                    setMostrarContrasena(
                      !mostrarContrasena
                    )
                  }
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={mostrarContrasena}
                  title={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarContrasena ? (
                    <FaEyeSlash aria-hidden="true" />
                  ) : (
                    <FaEye aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* RECUPERAR CONTRASEÑA */}

            <div className="forgot-password-container">
              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  navigate("/recuperar-contrasena")
                }
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* MENSAJE DE ERROR */}

            {error && (
              <div
                className="login-instructor-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* BOTÓN INGRESAR */}

            <button
              type="submit"
              className="login-instructor-button"
              disabled={cargando}
            >
              {cargando
                ? "Ingresando..."
                : "Ingresar"}
            </button>
          </form>

          {/* CAMBIAR ROL */}

          <button
            type="button"
            className="login-instructor-change-role"
            onClick={() => navigate("/")}
          >
            Cambiar tipo de usuario
          </button>
        </section>
      </main>

      {/* ======================================
          PIE DE PÁGINA
      ====================================== */}

      <footer className="login-instructor-footer">
        <div>
          <strong>DataVentor</strong>
          <small>Conocimiento que transforma</small>
        </div>

        <div className="login-instructor-footer-sena">
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

export default LoginInstructor;
