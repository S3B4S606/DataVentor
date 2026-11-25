
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "../../styles/Aprendiz/DashboardAprendiz.css";

interface Equipo {
  registro_unico: string;
  serial: string;
  modelo: string;
  sede: string;
  ambiente: string;
  estado: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

const DashboardAprendiz = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const mensajeExito = (
    location.state as { mensaje?: string } | null
  )?.mensaje;

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [serialDetectado, setSerialDetectado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] =
    useState("");

  // ==========================================
  // DETECTAR COMPUTADOR
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    const detectarEquipo = async () => {
      setCargando(true);
      setError("");
      setEquipo(null);
      setSerialDetectado("");

      try {
        // Obtener el ambiente seleccionado
        const ambienteGuardado =
          sessionStorage.getItem("ambienteAprendiz");

        if (
          !ambienteGuardado ||
          !Number.isInteger(Number(ambienteGuardado)) ||
          Number(ambienteGuardado) <= 0
        ) {
          navigate("/seleccionar-ambiente-aprendiz", {
            replace: true,
          });
          return;
        }

        // Detectar serial desde Windows
        const respuestaDetector = await fetch(
          "http://127.0.0.1:8765/identidad",
          {
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          }
        );

        if (!respuestaDetector.ok) {
          throw new Error(
            "No fue posible comunicarse con el detector local."
          );
        }

        const identidad = await respuestaDetector.json();

        const serial = String(
          identidad.serial || ""
        ).trim();

        if (!serial) {
          throw new Error(
            "Windows no devolvió el serial del computador."
          );
        }

        if (!activo) return;

        setSerialDetectado(serial);

        // Buscar o registrar el equipo en PostgreSQL
        const respuesta = await fetch(
          `${API_URL}/api/equipos/por-serial`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              serial,
              id_ambiente: Number(ambienteGuardado),
            }),
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          }
        );

        if (!respuesta.ok) {
          const detalle = await respuesta.json().catch(
            () => null
          );

          throw new Error(
            typeof detalle?.detail === "string"
              ? detalle.detail
              : "No fue posible consultar el equipo en PostgreSQL."
          );
        }

        const datos: Equipo = await respuesta.json();

        if (!activo) return;

        setEquipo(datos);

        if (datos.registro_unico) {
          localStorage.setItem(
            "equipoAsignado",
            datos.registro_unico
          );
        } else {
          localStorage.removeItem("equipoAsignado");
        }

      } catch (err) {
        if (!activo) return;

        console.error("Error de detección:", err);

        const mensaje =
          err instanceof Error &&
          (err.name === "TimeoutError" ||
            err.name === "AbortError")
            ? "La detección tardó demasiado. Comprueba que el detector local y FastAPI estén funcionando."
            : err instanceof Error
            ? err.message
            : "No fue posible detectar el computador.";

        setError(mensaje);

      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    detectarEquipo();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [navigate]);

  // ==========================================
  // CONFIRMAR BUEN ESTADO
  // ==========================================

  const confirmarBuenEstado = async () => {
    if (!equipo || confirmando) return;

    setConfirmando(true);
    setMensajeConfirmacion("");

    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch(
        `${API_URL}/api/equipos/confirmar-estado`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            registro_unico: equipo.registro_unico,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          "No fue posible confirmar el estado."
        );
      }

      setMensajeConfirmacion(
        "¡Listo! Estado del equipo confirmado correctamente."
      );

      setEquipo((prev) =>
        prev
          ? {
              ...prev,
              estado: "buen_estado",
            }
          : null
      );

    } catch (err) {
      console.error(
        "Error confirmando estado:",
        err
      );

      setMensajeConfirmacion(
        "No fue posible confirmar el estado. Verifica la conexión."
      );

    } finally {
      setConfirmando(false);
    }
  };

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  const hacerReporte = () => {
    navigate("/login-aprendiz");
  };

  const reportarOtroEquipo = () => {
    navigate("/login-aprendiz?otro=1");
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");

    navigate("/");
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="dashboard-aprendiz">

      {/* ENCABEZADO */}

      <header className="header-aprendiz">
        <div className="logo-container">
          <h1>
            Data
            <span className="logo-verde">
              Ventor
            </span>
          </h1>

          <span>
            Gestión de equipos en ambientes SENA
          </span>
        </div>

        <nav
          className="header-nav"
          aria-label="Navegación principal"
        >
          <button
            type="button"
            className="btn-inicio"
            onClick={() => navigate("/")}
          >
            <span className="home-icon">⌂</span>
            Inicio
          </button>

          <div className="usuario-header">
            <div className="usuario-icon">
              <span>♙</span>
            </div>

            <span>Aprendiz</span>
          </div>

          <button
            type="button"
            className="btn-cerrar"
            onClick={cerrarSesion}
          >
            <span className="logout-icon">↪</span>
            Cerrar sesión
          </button>
        </nav>
      </header>

      {/* MENSAJE DE REPORTE EXITOSO */}

      {mensajeExito && (
        <div
          className="mensaje-reporte-exito"
          role="status"
        >
          <span>✓</span>
          {mensajeExito}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}

      <main className="contenido-aprendiz">

        {/* PRESENTACIÓN */}

        <section className="presentacion">
          <h2>
            ¡Hola,
            <br />
            <span className="texto-aprendiz">
              aprendiz
            </span>{" "}
            <span className="emoji-saludo">
              👋
            </span>
            !
          </h2>

          <p>
            Gestiona y reporta el estado de los
            equipos en tu ambiente de forma rápida
            y sencilla.
          </p>

          <div className="linea-decorativa" />

          <p className="frase">
            “Ambientes que funcionan, aprendices
            que avanzan”
          </p>
        </section>

        {/* TARJETA DEL COMPUTADOR */}

        <section className="tarjeta-equipo">

          {/* CONSULTANDO EQUIPO */}

          {cargando && (
            <div className="estado-carga">
              <div
                className="spinner"
                aria-hidden="true"
              />

              <strong>
                Consultando equipo...
              </strong>

              <span>
                Estamos buscando el equipo asociado
                a tu ambiente.
              </span>
            </div>
          )}

          {/* ERROR DE DETECCIÓN */}

          {!cargando && error && (
            <div className="estado-error">
              <div className="icono-error">
                !
              </div>

              <strong>
                No fue posible detectar el equipo
              </strong>

              <span>{error}</span>
            </div>
          )}

          {/* COMPUTADOR CON SERIAL,
              PERO SIN REGISTRO */}

          {!cargando &&
            !error &&
            serialDetectado &&
            !equipo && (
              <div className="estado-carga">

                <div className="check-detectado">
                  ✓
                </div>

                <h3>
                  Computador identificado correctamente
                </h3>

                <p>
                  <strong>Serial:</strong>{" "}
                  {serialDetectado}
                </p>

                <p>
                  <strong>Registro:</strong>{" "}
                  Pendiente de registro
                </p>

                <p>
                  <strong>Sede:</strong>{" "}
                  Sin asignar
                </p>

                <p>
                  <strong>Ambiente:</strong>{" "}
                  Sin asignar
                </p>

                <span>
                  DataVentor identificó este computador,
                  pero todavía no tiene una ubicación
                  registrada.
                </span>
              </div>
            )}

          {/* SIN EQUIPO */}

          {!cargando &&
            !error &&
            !equipo &&
            !serialDetectado && (
              <div className="estado-error">
                <div className="icono-error">
                  !
                </div>

                <strong>
                  No se encontró ningún equipo
                </strong>

                <span>
                  No hay un equipo asociado al
                  ambiente actual.
                </span>
              </div>
            )}

          {/* EQUIPO DETECTADO */}

          {!cargando && !error && equipo && (
            <>
              <div className="equipo-detectado">
                <div className="check-detectado">
                  ✓
                </div>

                <div className="texto-detectado">
                  <strong>
                    Equipo detectado correctamente
                  </strong>

                  <p>
                    Estos son los datos del equipo
                    consultado.
                  </p>
                </div>
              </div>

              {/* INFORMACIÓN DEL EQUIPO */}

              <div className="informacion-equipo">

                {/* IMAGEN */}

                <div className="imagen-equipo">
                  <svg
                    className="icono-computador"
                    viewBox="0 0 220 170"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Ilustración de un computador"
                    role="img"
                  >
                    <rect
                      className="computador-pantalla"
                      x="43"
                      y="20"
                      width="134"
                      height="92"
                      rx="5"
                    />

                    <rect
                      className="computador-pantalla-interior"
                      x="51"
                      y="28"
                      width="118"
                      height="76"
                      rx="2"
                    />

                    <circle
                      className="computador-camara"
                      cx="110"
                      cy="25"
                      r="2"
                    />

                    <rect
                      className="computador-soporte"
                      x="94"
                      y="112"
                      width="32"
                      height="7"
                      rx="2"
                    />

                    <rect
                      className="computador-base"
                      x="28"
                      y="121"
                      width="164"
                      height="8"
                      rx="5"
                    />
                  </svg>
                </div>

                {/* DATOS DEL COMPUTADOR */}

                <div className="datos-equipo">
                  <div className="dato">
                    <span>Registro único:</span>
                    <strong>
                      {equipo.registro_unico}
                    </strong>
                  </div>

                  <div className="dato">
                    <span>Serial:</span>
                    <strong>
                      {equipo.serial}
                    </strong>
                  </div>

                  <div className="dato">
                    <span>Modelo:</span>
                    <strong>
                      {equipo.modelo}
                    </strong>
                  </div>

                  <div className="dato">
                    <span>Sede:</span>
                    <strong>
                      {equipo.sede}
                    </strong>
                  </div>

                  <div className="dato">
                    <span>Ambiente:</span>
                    <strong>
                      {equipo.ambiente}
                    </strong>
                  </div>

                  <div className="dato estado-row">
                    <span>Estado actual:</span>

                    <strong className="estado-equipo">
                      <span className="estado-punto" />
                      {equipo.estado}
                    </strong>
                  </div>
                </div>
              </div>

              {/* DOS BOTONES PRINCIPALES */}

              <div className="acciones-principales">

                <button
                  type="button"
                  className="btn-confirmar"
                  onClick={confirmarBuenEstado}
                  disabled={confirmando}
                >
                  <span className="icono-check">
                    {confirmando ? "…" : "✓"}
                  </span>

                  <span className="texto-boton">
                    <strong>
                      {confirmando
                        ? "Confirmando..."
                        : "Confirmar buen estado"}
                    </strong>

                    <small>
                      Registrar confirmación
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  className="btn-reporte"
                  onClick={hacerReporte}
                >
                  <span className="icono-alerta">
                    !
                  </span>

                  <span className="texto-boton">
                    <strong>
                      Hacer reporte
                    </strong>

                    <small>
                      Reportar una novedad
                    </small>
                  </span>
                </button>
              </div>

              {/* MENSAJE DE CONFIRMACIÓN */}

              {mensajeConfirmacion && (
                <div
                  className="mensaje-confirmacion"
                  role="status"
                >
                  {mensajeConfirmacion}
                </div>
              )}
            </>
          )}

          {/* TERCER BOTÓN:
              DISPONIBLE AUN SIN DETECCIÓN */}

          <div className="acciones-otro-equipo">
            <button
              type="button"
              className="btn-otro-equipo"
              onClick={reportarOtroEquipo}
            >
              <span aria-hidden="true">
                🖥️
              </span>

              <span>
                Reportar desde otro equipo
              </span>
            </button>
          </div>

        </section>
      </main>

      {/* PIE DE PÁGINA */}

      <footer className="footer-aprendiz">
        <div className="footer-left">
          <strong>
            DataVentor
          </strong>

          <span>
            Gestión de equipos en ambientes SENA
          </span>
        </div>

        <div className="footer-right">
          <strong>
            SENA
          </strong>

          <span>
            Centro de Gestión de Mercados,
            Logística y Tecnologías de la
            Información
          </span>
        </div>
      </footer>
    </div>
  );
};

export default DashboardAprendiz;
