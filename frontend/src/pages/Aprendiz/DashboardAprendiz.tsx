import React, { useEffect, useState } from "react";
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

const DashboardAprendiz: React.FC = () => {
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");


  // OBTENER EQUIPO DETECTADO
  useEffect(() => {
    const obtenerEquipo = async () => {
      try {
        setCargando(true);
        setError("");

        const token = localStorage.getItem("token");

        const respuesta = await fetch(
          "http://localhost:5000/api/equipos/detectado",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",

              ...(token && {
                Authorization: `Bearer ${token}`,
              }),
            },
          }
        );

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener el equipo.");
        }

        const datos: Equipo = await respuesta.json();

        setEquipo(datos);
      } catch (error) {
        console.error("Error obteniendo equipo:", error);

        setError("No fue posible detectar el equipo.");
      } finally {
        setCargando(false);
      }
    };

    obtenerEquipo();
  }, []);

  // CONFIRMAR BUEN ESTADO


  const confirmarBuenEstado = async () => {
    if (!equipo) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch(
        "http://localhost:5000/api/equipos/confirmar-estado",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },

          body: JSON.stringify({
            registro_unico: equipo.registro_unico,
          }),
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          "No fue posible confirmar el estado del equipo."
        );
      }

      alert("El estado del equipo fue confirmado correctamente.");
    } catch (error) {
      console.error("Error confirmando estado:", error);

      alert("No fue posible confirmar el estado del equipo.");
    }
  };

  // =====================================================
  // HACER REPORTE
  // =====================================================

  const hacerReporte = () => {
    navigate("/crear-reporte");
  };

  // =====================================================
  // IR A INICIO
  // =====================================================

  const irInicio = () => {
    navigate("/");
  };

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navigate("/login");
  };

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <div className="dashboard-aprendiz">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header-aprendiz">

        <div className="logo-container">

          <h1>
            DataVentor
          </h1>

          <span>
            Gestión de equipos en ambientes SENA
          </span>

        </div>


        <nav className="header-nav">

          <button
            type="button"
            className="btn-inicio"
            onClick={irInicio}
          >

            <span className="home-icon">
              ⌂
            </span>

            <span>
              Inicio
            </span>

          </button>


          <div className="usuario-header">

            <div className="usuario-icon">
              <span>
                ♙
              </span>
            </div>

            <span>
              Aprendiz
            </span>

          </div>


          <button
            type="button"
            className="btn-cerrar"
            onClick={cerrarSesion}
          >

            <span className="logout-icon">
              ↪
            </span>

            <span>
              Cerrar sesión
            </span>

          </button>

        </nav>

      </header>


      {/* =================================================
          CONTENIDO PRINCIPAL
      ================================================= */}

      <main className="contenido-aprendiz">


        {/* =================================================
            PRESENTACIÓN
        ================================================= */}

        <section className="presentacion">

          <h2>
            ¡Hola,
            <br />
            aprendiz <span>👋</span>!
          </h2>

          <p>
            Gestiona y reporta el estado de los
            equipos en tu ambiente de forma rápida
            y sencilla.
          </p>

          <div className="linea-decorativa"></div>

          <p className="frase">
            “Ambientes que funcionan,
            aprendices que avanzan”
          </p>

        </section>


        {/* =================================================
            TARJETA DEL EQUIPO
        ================================================= */}

        <section className="tarjeta-equipo">


          {/* =================================================
              CARGANDO
          ================================================= */}

          {cargando && (

            <div className="estado-carga">

              <div className="spinner"></div>

              <strong>
                Detectando equipo...
              </strong>

              <span>
                Estamos buscando el equipo asociado a tu ambiente.
              </span>

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!cargando && error && (

            <div className="estado-error">

              <div className="icono-error">
                !
              </div>

              <strong>
                No fue posible detectar el equipo
              </strong>

              <span>
                {error}
              </span>

            </div>

          )}


          {/* =================================================
              EQUIPO ENCONTRADO
          ================================================= */}

          {!cargando && !error && equipo && (

            <>

              {/* AVISO */}

              <div className="equipo-detectado">

                <div className="check-detectado">
                  ✓
                </div>

                <div className="texto-detectado">

                  <strong>
                    Equipo detectado automáticamente
                  </strong>

                  <p>
                    Se ha identificado un equipo en tu ambiente.
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
                  >

                    <rect
                      x="43"
                      y="20"
                      width="134"
                      height="92"
                      rx="5"
                      className="computador-pantalla"
                    />

                    <rect
                      x="51"
                      y="28"
                      width="118"
                      height="76"
                      rx="2"
                      className="computador-pantalla-interior"
                    />

                    <circle
                      cx="110"
                      cy="25"
                      r="2"
                      className="computador-camara"
                    />

                    <rect
                      x="94"
                      y="112"
                      width="32"
                      height="7"
                      rx="2"
                      className="computador-soporte"
                    />

                    <rect
                      x="28"
                      y="121"
                      width="164"
                      height="8"
                      rx="5"
                      className="computador-base"
                    />

                  </svg>

                </div>


                {/* DATOS */}

                <div className="datos-equipo">


                  <div className="dato">

                    <span>
                      Registro único:
                    </span>

                    <strong>
                      {equipo.registro_unico}
                    </strong>

                  </div>


                  <div className="dato">

                    <span>
                      Serial:
                    </span>

                    <strong>
                      {equipo.serial}
                    </strong>

                  </div>


                  <div className="dato">

                    <span>
                      Modelo:
                    </span>

                    <strong>
                      {equipo.modelo}
                    </strong>

                  </div>


                  <div className="dato">

                    <span>
                      Sede:
                    </span>

                    <strong>
                      {equipo.sede}
                    </strong>

                  </div>


                  <div className="dato">

                    <span>
                      Ambiente:
                    </span>

                    <strong>
                      {equipo.ambiente}
                    </strong>

                  </div>


                  <div className="dato estado-row">

                    <span>
                      Estado actual:
                    </span>

                    <strong className="estado-equipo">

                      <span className="estado-punto"></span>

                      {equipo.estado}

                    </strong>

                  </div>

                </div>

              </div>


              {/* =================================================
                  BOTONES
              ================================================= */}

              <div className="acciones-equipo">


                {/* CONFIRMAR BUEN ESTADO */}

                <button
                  type="button"
                  className="btn-confirmar"
                  onClick={confirmarBuenEstado}
                >

                  <span className="icono-check">
                    ✓
                  </span>

                  <div className="texto-boton">

                    <strong>
                      Confirmar buen estado
                    </strong>

                    <small>
                      Se guarda en temporal
                    </small>

                  </div>

                </button>


                {/* HACER REPORTE */}

                <button
                  type="button"
                  className="btn-reporte"
                  onClick={hacerReporte}
                >

                  <span className="icono-alerta">
                    ⚠
                  </span>

                  <div className="texto-boton">

                    <strong>
                      Hacer reporte
                    </strong>

                    <small>
                      Requiere iniciar sesión
                    </small>

                  </div>

                </button>

              </div>

            </>

          )}


          {/* =================================================
              SIN EQUIPO
          ================================================= */}

          {!cargando && !error && !equipo && (

            <div className="estado-error">

              <div className="icono-error">
                !
              </div>

              <strong>
                No se encontró ningún equipo
              </strong>

              <span>
                No hay un equipo asociado al ambiente actual.
              </span>

            </div>

          )}

        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

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
            Logística y Tecnologías de la Información
          </span>

        </div>

      </footer>

    </div>
  );
};

export default DashboardAprendiz;