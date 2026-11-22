
import { useState } from "react";
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
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const ingresar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!tipoDocumento) {
      setError("Selecciona el tipo de documento.");
      return;
    }

    if (!numeroDocumento.trim()) {
      setError("Ingresa tu número de documento.");
      return;
    }

    if (!/^\d+$/.test(numeroDocumento)) {
      setError("El documento solo debe contener números.");
      return;
    }

    if (!contrasena.trim()) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo_documento: tipoDocumento,
          documento: numeroDocumento,
          contrasena: contrasena,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.detail || datos.mensaje || "No fue posible iniciar sesión."
        );
        return;
      }

      if (
        datos.usuario?.rol !== "instructor" ||
        !datos.usuario?.id_usuario ||
        !datos.token
      ) {
        setError("No se pudo validar el acceso como Instructor.");
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(datos.usuario));
      localStorage.setItem("token", datos.token);
      localStorage.setItem("rol", "instructor");
      localStorage.setItem("tipoDocumentoInstructor", tipoDocumento);
      localStorage.setItem("numeroDocumentoInstructor", numeroDocumento);

      navigate("/dashboard-instructor");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("No fue posible conectar con el backend.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-instructor">
      <header className="login-instructor-header">
        <div className="login-instructor-logo">
          <strong>DataVentor</strong>
          <small>Gestión de equipos en ambientes SENA</small>
        </div>

        <button
          type="button"
          className="login-instructor-back"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft />
          Volver
        </button>
      </header>

      <main className="login-instructor-content">
        <section className="login-instructor-card">
          <div className="login-instructor-icon">
            <FaChalkboardTeacher />
          </div>

          <h1>Inicio de sesión</h1>

          <p className="login-instructor-subtitle">
            Ingresa tus datos para continuar como Instructor.
          </p>

          <form onSubmit={ingresar}>
            <div className="login-instructor-group">
              <label htmlFor="tipoDocumentoInstructor">
                Tipo de documento
              </label>

              <div className="login-instructor-input">
                <FaIdCard />

                <select
                  id="tipoDocumentoInstructor"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                </select>
              </div>
            </div>

            <div className="login-instructor-group">
              <label htmlFor="numeroDocumentoInstructor">
                Número de documento
              </label>

              <div className="login-instructor-input">
                <FaIdCard />

                <input
                  id="numeroDocumentoInstructor"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ingresa tu número de documento"
                  value={numeroDocumento}
                  onChange={(e) =>
                    setNumeroDocumento(e.target.value.replace(/\D/g, ""))
                  }
                  required
                />
              </div>
            </div>

            <div className="login-instructor-group">
              <label htmlFor="contrasenaInstructor">
                Contraseña
              </label>

              <div className="login-instructor-input">
                <FaLock />

                <input
                  id="contrasenaInstructor"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  style={{ paddingRight: "45px" }}
                />

                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
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
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "5px",
                    flexShrink: 0,
                  }}
                >
                  {mostrarContrasena ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* OLVIDÉ MI CONTRASEÑA */}
            <div className="forgot-password-container">
              <button
                type="button"
                className="forgot-password"
                onClick={() => navigate("/recuperar-contrasena")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <div className="login-instructor-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-instructor-button"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <button
            type="button"
            className="login-instructor-change-role"
            onClick={() => navigate("/")}
          >
            Cambiar tipo de usuario
          </button>
        </section>
      </main>

      <footer className="login-instructor-footer">
        <div>
          <strong>DataVentor</strong>
          <small>Conocimiento que transforma</small>
        </div>

        <div className="login-instructor-footer-sena">
          <strong>SENA</strong>
          <small>
            Centro de Gestión de Mercados, Logística y Tecnologías
            de la Información
          </small>
        </div>
      </footer>
    </div>
  );
}

export default LoginInstructor;
