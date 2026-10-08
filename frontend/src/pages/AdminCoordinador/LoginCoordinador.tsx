import { useState } from "react";
import {
  FaArrowLeft,
  FaIdCard,
  FaLock,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../../styles/AdminCoordinador/LoginCoordinador.css";

function LoginCoordinador() {
  const navigate = useNavigate();

  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const ingresar = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    // Validar tipo de documento
    if (!tipoDocumento) {
      setError("Selecciona el tipo de documento.");
      return;
    }

    // Validar número de documento
    if (!numeroDocumento.trim()) {
      setError("Ingresa el número de documento.");
      return;
    }

    if (!/^\d+$/.test(numeroDocumento)) {
      setError(
        "El número de documento solo debe contener números."
      );
      return;
    }

    // Validar contraseña
    if (!contrasena.trim()) {
      setError("Ingresa tu contraseña.");
      return;
    }

    /*
      Por ahora solamente comprobamos
      el funcionamiento del formulario.

      Después conectaremos este login
      con el backend y PostgreSQL.
    */

    localStorage.setItem(
      "tipoDocumentoCoordinador",
      tipoDocumento
    );

    localStorage.setItem(
      "numeroDocumentoCoordinador",
      numeroDocumento
    );

    localStorage.setItem(
      "rol",
      "coordinador"
    );

    navigate("/dashboard-admin");
  };

  return (
    <div className="login-coordinador">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="login-header">

        <div className="login-logo">

          <strong>
            DataVentor
          </strong>

          <small>
            Gestión de equipos en ambientes SENA
          </small>

        </div>

        <button
          type="button"
          className="login-back"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft />
          Volver
        </button>

      </header>

      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="login-content">

        <section className="login-card">

          {/* ICONO */}

          <div className="login-icon">
            <FaUserShield />
          </div>

          {/* TÍTULO */}

          <h1>
            Inicio de sesión
          </h1>

          <p className="login-subtitle">
            Ingresa tus datos para continuar como
            Administrador o Coordinador.
          </p>

          {/* =================================================
              FORMULARIO
              ================================================= */}

          <form onSubmit={ingresar}>

            {/* TIPO DE DOCUMENTO */}

            <div className="form-group">

              <label htmlFor="tipoDocumento">
                Tipo de documento
              </label>

              <div className="input-container">

                <FaIdCard />

                <select
                  id="tipoDocumento"
                  value={tipoDocumento}
                  onChange={(e) =>
                    setTipoDocumento(e.target.value)
                  }
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

            <div className="form-group">

              <label htmlFor="numeroDocumento">
                Número de documento
              </label>

              <div className="input-container">

                <FaIdCard />

                <input
                  id="numeroDocumento"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ingresa tu número de documento"
                  value={numeroDocumento}
                  onChange={(e) => {

                    const valor =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setNumeroDocumento(valor);

                  }}
                />

              </div>

            </div>

            {/* CONTRASEÑA */}

            <div className="form-group">

              <label htmlFor="contrasena">
                Contraseña
              </label>

              <div className="input-container">

                <FaLock />

                <input
                  id="contrasena"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(e) =>
                    setContrasena(e.target.value)
                  }
                />

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {/* BOTÓN */}

            <button
              type="submit"
              className="login-button"
            >
              Ingresar
            </button>

          </form>

          {/* CAMBIAR TIPO DE USUARIO */}

          <button
            type="button"
            className="change-role"
            onClick={() => navigate("/")}
          >
            Cambiar tipo de usuario
          </button>

        </section>

      </main>

      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="login-footer">

        <div>

          <strong>
            DataVentor
          </strong>

          <small>
            Conocimiento que transforma
          </small>

        </div>

        <div className="footer-sena">

          <strong>
            SENA
          </strong>

          <small>
            Centro de Gestión de Mercados,
            Logística y Tecnologías de la Información
          </small>

        </div>

      </footer>

    </div>
  );
}

export default LoginCoordinador;