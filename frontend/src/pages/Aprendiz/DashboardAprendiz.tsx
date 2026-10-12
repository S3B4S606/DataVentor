
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Aprendiz/DashboardAprendiz.css";

interface Equipo {
  registro_unico: string;
  serial: string;
  modelo: string;
  sede: string;
  ambiente: string;
  estado: string;
}

const DashboardAprendiz = () => {
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    const obtenerEquipo = async () => {
      try {
        const token = localStorage.getItem("token");
        const respuesta = await fetch(
          "http://localhost:5000/api/equipos/detectado",
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener el equipo.");
        }

        const datos: Equipo = await respuesta.json();
        setEquipo(datos);
      } catch (err) {
        console.error("Error obteniendo equipo:", err);
        setError(
          "No fue posible detectar el equipo. El backend debe estar disponible para consultar los datos."
        );
      } finally {
        setCargando(false);
      }
    };

    obtenerEquipo();
  }, []);

  const confirmarBuenEstado = async () => {
    if (!equipo || confirmando) return;

    setConfirmando(true);

    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(
        "http://localhost:5000/api/equipos/confirmar-estado",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            registro_unico: equipo.registro_unico,
          }),
        }
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible confirmar el estado.");
      }

      alert("El estado del equipo fue confirmado correctamente.");
    } catch (err) {
      console.error("Error confirmando estado:", err);
      alert("No fue posible confirmar el estado. Verifica la conexión.");
    } finally {
      setConfirmando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <div className="dashboard-aprendiz">
      <header className="header-aprendiz">
        <div className="logo-container">
          <h1>DataVentor</h1>
          <span>Gestión de equipos en ambientes SENA</span>
        </div>

        <nav className="header-nav">
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

      <main className="contenido-aprendiz">
        <section className="presentacion">
          <h2>
            ¡Hola,
            <br />
            aprendiz <span>👋</span>!
          </h2>

          <p>
            Gestiona y reporta el estado de los equipos en tu ambiente de
            forma rápida y sencilla.
          </p>

          <div className="linea-decorativa" />

          <p className="frase">
            “Ambientes que funcionan, aprendices que avanzan”
          </p>
        </section>

        <section className="tarjeta-equipo">
          {cargando && (
            <div className="estado-carga">
              <div className="spinner" />
              <strong>Consultando equipo...</strong>
              <span>Estamos buscando el equipo asociado a tu ambiente.</span>
            </div>
          )}

          {!cargando && error && (
            <div className="estado-error">
              <div className="icono-error">!</div>
              <strong>No fue posible detectar el equipo</strong>
              <span>{error}</span>
            </div>
          )}

          {!cargando && !error && equipo && (
            <>
              <div className="equipo-detectado">
                <div className="check-detectado">✓</div>
                <div className="texto-detectado">
                  <strong>Equipo detectado correctamente</strong>
                  <p>Estos son los datos del equipo consultado.</p>
                </div>
              </div>

              <div className="informacion-equipo">
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
                    <circle className="computador-camara" cx="110" cy="25" r="2" />
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

                <div className="datos-equipo">
                  <div className="dato">
                    <span>Registro único:</span>
                    <strong>{equipo.registro_unico}</strong>
                  </div>

                  <div className="dato">
                    <span>Serial:</span>
                    <strong>{equipo.serial}</strong>
                  </div>

                  <div className="dato">
                    <span>Modelo:</span>
                    <strong>{equipo.modelo}</strong>
                  </div>

                  <div className="dato">
                    <span>Sede:</span>
                    <strong>{equipo.sede}</strong>
                  </div>

                  <div className="dato">
                    <span>Ambiente:</span>
                    <strong>{equipo.ambiente}</strong>
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

              <div className="acciones-equipo">
                <button
                  type="button"
                  className="btn-confirmar"
                  onClick={confirmarBuenEstado}
                  disabled={confirmando}
                >
                  <span className="icono-check">
                    {confirmando ? "…" : "✓"}
                  </span>
                  <div className="texto-boton">
                    <strong>
                      {confirmando ? "Confirmando..." : "Confirmar buen estado"}
                    </strong>
                    <small>Registrar confirmación</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn-reporte"
                  onClick={() => navigate("/crear-reporte")}
                >
                  <span className="icono-alerta">!</span>
                  <div className="texto-boton">
                    <strong>Hacer reporte</strong>
                    <small>Reportar una novedad</small>
                  </div>
                </button>
              </div>
            </>
          )}

          {!cargando && !error && !equipo && (
            <div className="estado-error">
              <div className="icono-error">!</div>
              <strong>No se encontró ningún equipo</strong>
              <span>No hay un equipo asociado al ambiente actual.</span>
            </div>
          )}
        </section>
      </main>

      <footer className="footer-aprendiz">
        <div className="footer-left">
          <strong>DataVentor</strong>
          <span>Gestión de equipos en ambientes SENA</span>
        </div>

        <div className="footer-right">
          <strong>SENA</strong>
          <span>
            Centro de Gestión de Mercados, Logística y Tecnologías de la
            Información
          </span>
        </div>
      </footer>
    </div>
  );
};

export default DashboardAprendiz;
