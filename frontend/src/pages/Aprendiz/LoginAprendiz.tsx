
import { useState } from "react";
import type { FormEvent } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import "../../styles/Aprendiz/LoginAprendiz.css";

export default function LoginAprendiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Identificar desde qué botón llegó el usuario
  const reportarOtroEquipo =
    searchParams.get("otro") === "1";

  const [tipoDocumento, setTipoDocumento] =
    useState("CC");

  const [documento, setDocumento] =
    useState("");

  const [contrasena, setContrasena] =
    useState("");

  const [error, setError] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  const iniciarSesion = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (cargando) return;

    setError("");
    setCargando(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://127.0.0.1:5000";

      const respuesta = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo_documento: tipoDocumento,
            documento: documento.trim(),
            contrasena,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          typeof datos.detail === "string"
            ? datos.detail
            : "Documento o contraseña incorrectos."
        );
        return;
      }

      const usuario = datos.usuario;
      const rol = usuario?.rol;

      // Solo aprendices e instructores
      // pueden crear reportes

      if (
        rol !== "aprendiz" &&
        rol !== "instructor"
      ) {
        setError(
          "Solo los aprendices e instructores pueden crear reportes."
        );
        return;
      }

      if (!usuario?.id_usuario || !datos.token) {
        setError(
          "No se pudo validar la sesión del usuario."
        );
        return;
      }

      // Guardar la sesión

      localStorage.setItem(
        "token",
        datos.token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );

      localStorage.setItem(
        "rol",
        rol
      );

      // Redirigir al formulario correspondiente

      navigate(
        reportarOtroEquipo
          ? "/crear-reporte?otro=1"
          : "/crear-reporte",
        { replace: true }
      );

    } catch (err) {
      console.error(
        "Error de inicio de sesión:",
        err
      );

      setError(
        "No fue posible conectar con el backend."
      );

    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // VOLVER AL DASHBOARD
  // ==========================================

  const volver = () => {
    navigate("/dashboard-aprendiz");
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <main className="login-aprendiz">

      <section className="login-aprendiz-card">

        {/* LOGOTIPO */}

        <h1 className="login-aprendiz-logo">
          Data<span>Ventor</span>
        </h1>

        {/* ICONO */}

        <div
          className="login-aprendiz-icono"
          aria-hidden="true"
        >
          <span>👤</span>
        </div>

        {/* TÍTULO */}

        <h2>Inicio de sesión</h2>

        <p className="login-aprendiz-subtitulo">
          {reportarOtroEquipo
            ? "Inicia sesión para reportar un computador diferente."
            : "Ingresa tus datos para continuar con el reporte del equipo."}
        </p>

        {/* FORMULARIO */}

        <form onSubmit={iniciarSesion}>

          {/* TIPO DE DOCUMENTO */}

          <label htmlFor="tipoDocumento">
            Tipo de documento
          </label>

          <select
            id="tipoDocumento"
            value={tipoDocumento}
            onChange={(e) =>
              setTipoDocumento(e.target.value)
            }
            disabled={cargando}
            required
          >
            <option value="CC">
              Cédula de ciudadanía
            </option>

            <option value="TI">
              Tarjeta de identidad
            </option>

            <option value="CE">
              Cédula de extranjería
            </option>

            <option value="PPT">
              PPT
            </option>
          </select>

          {/* NÚMERO DE DOCUMENTO */}

          <label htmlFor="documento">
            Número de documento
          </label>

          <input
            id="documento"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            value={documento}
            onChange={(e) =>
              setDocumento(e.target.value)
            }
            placeholder="Ingresa tu documento"
            disabled={cargando}
            required
          />

          {/* CONTRASEÑA */}

          <label htmlFor="contrasena">
            Contraseña
          </label>

          <input
            id="contrasena"
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) =>
              setContrasena(e.target.value)
            }
            placeholder="Ingresa tu contraseña"
            disabled={cargando}
            required
          />

          {/* MENSAJE DE ERROR */}

          {error && (
            <div
              className="login-aprendiz-error"
              role="alert"
            >
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* BOTÓN INGRESAR */}

          <button
            type="submit"
            className="login-aprendiz-ingresar"
            disabled={cargando}
          >
            {cargando
              ? "Ingresando..."
              : "Ingresar"}
          </button>
        </form>

        {/* VOLVER */}

        <button
          type="button"
          className="login-aprendiz-volver"
          onClick={volver}
        >
          <span aria-hidden="true">←</span>
          Volver al equipo detectado
        </button>

      </section>
    </main>
  );
}
