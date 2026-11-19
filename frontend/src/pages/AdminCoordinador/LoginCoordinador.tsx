
import { useState } from "react";
import type { FormEvent } from "react";
import {
  FaArrowLeft,
  FaIdCard,
  FaLock,
  FaUserShield,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../../styles/AdminCoordinador/LoginCoordinador.css";

function LoginCoordinador() {
  const navigate = useNavigate();

  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const ingresar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!tipoDocumento) {
      setError("Selecciona el tipo de documento.");
      return;
    }

    if (!numeroDocumento.trim()) {
      setError("Ingresa el número de documento.");
      return;
    }

    if (!/^\d+$/.test(numeroDocumento)) {
      setError("El número de documento solo debe contener números.");
      return;
    }

    if (!contrasena.trim()) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        "http://127.0.0.1:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo_documento: tipoDocumento,
            documento: numeroDocumento,
            contrasena: contrasena,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.detail ||
          datos.mensaje ||
          "No fue posible iniciar sesión."
        );
        return;
      }

      if (
        datos.usuario?.rol !== "administrador" ||
        !datos.usuario?.id_usuario ||
        !datos.token
      ) {
        setError("No tienes permisos para ingresar como Administrador.");
        return;
      }

      localStorage.setItem(
        "usuario",
        JSON.stringify(datos.usuario)
      );
      localStorage.setItem("token", datos.token);
      localStorage.setItem("rol", "administrador");
      localStorage.setItem(
        "tipoDocumentoCoordinador",
        tipoDocumento
      );
      localStorage.setItem(
        "numeroDocumentoCoordinador",
        numeroDocumento
      );

      navigate("/dashboard-admin", { replace: true });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("No fue posible conectar con el backend.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-coordinador">
      <header className="login-header">
        <div className="login-logo">
          <strong>DataVentor</strong>
          <small>Gestión de equipos en ambientes SENA</small>
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

      <main className="login-content">
        <section className="login-card">
          <div className="login-icon">
            <FaUserShield />
          </div>

          <h1>Inicio de sesión</h1>

          <p className="login-subtitle">
            Ingresa tus datos para continuar como
            Administrador o Coordinador.
          </p>

          <form onSubmit={ingresar}>
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

                  <option value="TI">
                     Tarjeta de identidad
                  </option>

                  <option value="CE">
                    Cédula de extranjería
                  </option>
                </select>
              </div>
            </div>

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
                    const valor = e.target.value.replace(/\D/g, "");
                    setNumeroDocumento(valor);
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contrasena">
                Contraseña
              </label>

              <div className="input-container">
                <FaLock />

                <input
                  id="contrasena"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(e) =>
                    setContrasena(e.target.value)
                  }
                  style={{ paddingRight: "45px" }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarContrasena(!mostrarContrasena)
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

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <button
            type="button"
            className="change-role"
            onClick={() => navigate("/")}
          >
            Cambiar tipo de usuario
          </button>
        </section>
      </main>

      <footer className="login-footer">
        <div>
          <strong>DataVentor</strong>
          <small>Conocimiento que transforma</small>
        </div>

        <div className="footer-sena">
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

export default LoginCoordinador;
