
import { useState } from "react";
import {
  FaArrowLeft,
  FaIdCard,
  FaLock,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../../styles/Instructor/LoginInstructor.css";

function LoginInstructor() {
  const navigate = useNavigate();

  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const ingresar = (e: React.FormEvent<HTMLFormElement>) => {
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

    // Validación provisional: todavía no consulta el backend.
    localStorage.setItem("tipoDocumentoInstructor", tipoDocumento);
    localStorage.setItem("numeroDocumentoInstructor", numeroDocumento);
    localStorage.setItem("rol", "instructor");

    navigate("/crear-reporte-instructor");
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
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="login-instructor-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-instructor-button"
            >
              Ingresar
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
