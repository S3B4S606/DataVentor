
import { useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaClipboardList,
  FaFileAlt,
  FaSignOutAlt,
  FaArrowRight,
  FaLaptop,
} from "react-icons/fa";

import "../../styles/Instructor/DashboardInstructor.css";

export default function DashboardInstructor() {
  const navigate = useNavigate();

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("tipoDocumentoInstructor");
    localStorage.removeItem("numeroDocumentoInstructor");

    navigate("/");
  };

  return (
    <div className="dashboard-instructor">

      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <header className="instructor-header">

        <div className="instructor-brand">
          <h1>
            Data<span>Ventor</span>
          </h1>

          <p>
            Gestión de equipos en ambientes SENA
          </p>
        </div>

        <button
          type="button"
          className="instructor-logout"
          onClick={cerrarSesion}
        >
          <FaSignOutAlt aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>

      </header>

      {/* ======================================
          CONTENIDO PRINCIPAL
      ====================================== */}

      <main className="instructor-main">

        {/* BIENVENIDA */}

        <section className="instructor-welcome">

          <div
            className="welcome-icon"
            aria-hidden="true"
          >
            <FaChalkboardTeacher />
          </div>

          <div className="welcome-content">

            <span className="welcome-label">
              PANEL DE INSTRUCTOR
            </span>

            <h2>
              Bienvenido a DataVentor
            </h2>

            <p>
              Desde aquí puedes reportar fallas
              y consultar el seguimiento de los
              equipos de los ambientes.
            </p>

          </div>
        </section>

        {/* ======================================
            OPCIONES DEL INSTRUCTOR
        ====================================== */}

        <section className="instructor-section">

          <div className="instructor-section-heading">
            <h2>
              ¿Qué deseas hacer?
            </h2>

            <p>
              Selecciona una opción para continuar.
            </p>
          </div>

          <div className="instructor-options">

            {/* CREAR REPORTE */}

            <article className="instructor-option">

              <div
                className="option-icon option-icon-blue"
                aria-hidden="true"
              >
                <FaFileAlt />
              </div>

              <h3>
                Crear reporte
              </h3>

              <p>
                Registra un problema o una falla
                presentada por un equipo.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/crear-reporte-instructor")
                }
              >
                <span>Crear reporte</span>
                <FaArrowRight aria-hidden="true" />
              </button>

            </article>

            {/* MIS REPORTES */}

            <article className="instructor-option">

              <div
                className="option-icon option-icon-purple"
                aria-hidden="true"
              >
                <FaClipboardList />
              </div>

              <h3>
                Mis reportes
              </h3>

              <p>
                Consulta los reportes que has
                registrado y revisa su estado.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/mis-reportes-instructor")
                }
              >
                <span>Ver mis reportes</span>
                <FaArrowRight aria-hidden="true" />
              </button>

            </article>

          </div>
        </section>

        {/* ======================================
            PANEL INFORMATIVO
        ====================================== */}

        <section className="instructor-help">

          <FaLaptop
            className="help-icon"
            aria-hidden="true"
          />

          <div className="help-content">

            <h3>
              Gestión de equipos
            </h3>

            <p>
              Registra la información del equipo
              y describe claramente la falla
              para facilitar su revisión por
              parte del técnico.
            </p>

          </div>
        </section>

      </main>

      {/* ======================================
          PIE DE PÁGINA
      ====================================== */}

      <footer className="instructor-footer">

        <strong>
          DataVentor
        </strong>

        <span>
          SENA · Gestión de equipos en ambientes
        </span>

      </footer>

    </div>
  );
}
