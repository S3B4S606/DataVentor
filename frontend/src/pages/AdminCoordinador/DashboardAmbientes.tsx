import { useEffect, useMemo, useState } from "react";
import {
  FaHome,
  FaBuilding,
  FaCalendarAlt,
  FaUser,
  FaSignOutAlt,
  FaSearch,
  FaPlus,
  FaMapMarkerAlt,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../../styles/AdminCoordinador/DashboardAmbientes.css";

const API_URL = "http://127.0.0.1:5001";

interface Equipo {
  id_equipo?: number;
  id_ambiente?: number;
  estado?: string;
  estado_equipo?: string;
}

interface Ambiente {
  id_ambiente?: number;
  nombre?: string;
  descripcion?: string;
  id_sede?: number;
}

interface AmbienteConEstadisticas extends Ambiente {
  total: number;
  buenos: number;
  dañados: number;
  sinPrender: number;
}

function DashboardAmbientes() {
  const navigate = useNavigate();

  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  /* =====================================================
     CARGAR DATOS
     ===================================================== */

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [
          ambientesResponse,
          equiposResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/ambientes`),
          fetch(`${API_URL}/api/equipos`),
        ]);

        const ambientesData =
          await ambientesResponse.json();

        const equiposData =
          await equiposResponse.json();

        if (!ambientesResponse.ok) {
          throw new Error(
            ambientesData?.mensaje ||
              "No se pudieron cargar los ambientes."
          );
        }

        if (!equiposResponse.ok) {
          throw new Error(
            equiposData?.mensaje ||
              "No se pudieron cargar los equipos."
          );
        }

        setAmbientes(
          Array.isArray(ambientesData)
            ? ambientesData
            : []
        );

        setEquipos(
          Array.isArray(equiposData)
            ? equiposData
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando ambientes:",
          error
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  /* =====================================================
     ESTADO DE EQUIPO
     ===================================================== */

  const obtenerEstadoEquipo = (
    equipo: Equipo
  ) => {
    return String(
      equipo.estado_equipo ??
        equipo.estado ??
        ""
    ).toLowerCase();
  };

  /* =====================================================
     ESTADÍSTICAS DE CADA AMBIENTE
     ===================================================== */

  const ambientesConEstadisticas =
    useMemo<AmbienteConEstadisticas[]>(() => {
      return ambientes.map((ambiente) => {
        const equiposAmbiente =
          equipos.filter(
            (equipo) =>
              String(equipo.id_ambiente) ===
              String(ambiente.id_ambiente)
          );

        let buenos = 0;
        let dañados = 0;
        let sinPrender = 0;

        equiposAmbiente.forEach((equipo) => {
          const estado =
            obtenerEstadoEquipo(equipo);

          if (
            estado.includes("bueno") ||
            estado.includes("operativo") ||
            estado.includes("disponible") ||
            estado.includes("funciona") ||
            estado.includes("activo")
          ) {
            buenos++;
          } else if (
            estado.includes("dañado") ||
            estado.includes("danado") ||
            estado.includes("averiado") ||
            estado.includes("daño") ||
            estado.includes("mantenimiento")
          ) {
            dañados++;
          } else if (
            estado.includes("sin") ||
            estado.includes("apagado") ||
            estado.includes("inactivo")
          ) {
            sinPrender++;
          }
        });

        return {
          ...ambiente,
          total: equiposAmbiente.length,
          buenos,
          dañados,
          sinPrender,
        };
      });
    }, [ambientes, equipos]);

  /* =====================================================
     FILTRAR AMBIENTES
     ===================================================== */

  const ambientesFiltrados =
    useMemo(() => {
      const texto =
        busqueda.trim().toLowerCase();

      if (!texto) {
        return ambientesConEstadisticas;
      }

      return ambientesConEstadisticas.filter(
        (ambiente) =>
          String(
            ambiente.nombre || ""
          )
            .toLowerCase()
            .includes(texto) ||
          String(
            ambiente.descripcion || ""
          )
            .toLowerCase()
            .includes(texto) ||
          String(
            ambiente.id_ambiente || ""
          )
            .includes(texto)
      );
    }, [
      ambientesConEstadisticas,
      busqueda,
    ]);

  /* =====================================================
     ESTADO GENERAL
     ===================================================== */

  const obtenerEstadoGeneral = (
    ambiente: AmbienteConEstadisticas
  ) => {
    if (ambiente.dañados > 0) {
      return {
        texto: "Con novedades",
        clase: "novedades",
      };
    }

    if (ambiente.sinPrender > 0) {
      return {
        texto: "Con novedades",
        clase: "novedades",
      };
    }

    return {
      texto: "Operativo",
      clase: "operativo",
    };
  };

  /* =====================================================
     FECHA
     ===================================================== */

  const fechaActual =
    new Date().toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );

  /* =====================================================
     CERRAR SESIÓN
     ===================================================== */

  const cerrarSesion = () => {
    navigate("/login");
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="dashboard-ambientes">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="ambientes-header">

        <div className="ambientes-logo">

          <div className="logo-text">

            <strong>
              Data<span>Ventor</span>
            </strong>

            <small>
              Gestión de equipos en ambientes SENA
            </small>

          </div>

        </div>

        <nav className="ambientes-navigation">

          <button
            className="nav-link"
            onClick={() =>
              navigate("/dashboard-admin")
            }
          >
            <FaHome />
            Inicio
          </button>

          <button
            className="nav-link active"
          >
            <FaBuilding />
            Ambientes
          </button>

        </nav>

        <div className="ambientes-header-right">

          <div className="coordinator">

            <div className="coordinator-icon">
              <FaUser />
            </div>

            <div>
              <strong>
                Coordinador
              </strong>

              <small>
                Centro de Gestión
              </small>
            </div>

          </div>

          <div className="header-separator" />

          <button
            className="logout"
            onClick={cerrarSesion}
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>

        </div>

      </header>

      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="ambientes-content">

        {/* =================================================
            FILTROS SUPERIORES
            ================================================= */}

        <section className="ambientes-filters">

          {/* SEDE */}

          <div className="filter-card">

            <div className="filter-icon blue">
              <FaBuilding />
            </div>

            <div className="filter-info">

              <span>
                Sede
              </span>

              <strong>
                Centro de Gestión
              </strong>

            </div>

          </div>

          {/* AMBIENTE */}

          <div className="filter-card">

            <div className="filter-icon purple">
              <FaMapMarkerAlt />
            </div>

            <div className="filter-info">

              <span>
                Ambiente
              </span>

              <strong>
                Todos los ambientes
              </strong>

            </div>

          </div>

          {/* FECHA */}

          <div className="filter-card">

            <div className="filter-icon blue">
              <FaCalendarAlt />
            </div>

            <div className="filter-info">

              <span>
                Fecha
              </span>

              <strong>
                {fechaActual}
              </strong>

            </div>

          </div>

          {/* COORDINADOR */}

          <div className="filter-card">

            <div className="filter-icon purple">
              <FaUser />
            </div>

            <div className="filter-info">

              <span>
                Coordinador
              </span>

              <strong>
                Coordinador
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            LISTA DE AMBIENTES
            ================================================= */}

        <section className="ambientes-list-card">

          {/* ENCABEZADO */}

          <div className="list-header">

            <div className="list-title">

              <div className="list-icon">
                <FaMapMarkerAlt />
              </div>

              <div>

                <h1>
                  Lista de ambientes
                </h1>

                <p>
                  Consulta los ambientes y el estado
                  de sus equipos.
                </p>

              </div>

            </div>

            <div className="list-actions">

              {/* BUSCAR */}

              <div className="search-box">

                <FaSearch />

                <input
                  type="text"
                  placeholder="Buscar ambiente..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* AGREGAR */}

              <button
                className="add-button"
                onClick={() =>
                  navigate(
                    "/registrar-ambiente"
                  )
                }
              >
                <FaPlus />
                Agregar ambiente
              </button>

            </div>

          </div>

          {/* =================================================
              TABLA
              ================================================= */}

          <div className="ambientes-table-wrapper">

            <table className="ambientes-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>
                    Ambiente
                  </th>

                  <th>
                    Descripción
                  </th>

                  <th>
                    Total equipos
                  </th>

                  <th>
                    Buenos
                  </th>

                  <th>
                    Dañados
                  </th>

                  <th>
                    Sin prender
                  </th>

                  <th>
                    Estado general
                  </th>

                  <th>
                    Acciones
                  </th>

                </tr>

              </thead>

              <tbody>

                {cargando ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="empty-row"
                    >
                      Cargando ambientes...
                    </td>

                  </tr>

                ) : ambientesFiltrados.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="empty-row"
                    >
                      No se encontraron ambientes.
                    </td>

                  </tr>

                ) : (

                  ambientesFiltrados.map(
                    (ambiente, index) => {

                      const estado =
                        obtenerEstadoGeneral(
                          ambiente
                        );

                      return (

                        <tr
                          key={
                            ambiente.id_ambiente
                          }
                        >

                          <td className="number-cell">
                            {index + 1}
                          </td>

                          <td>

                            <strong className="ambiente-name">

                              {ambiente.nombre ||
                                `Ambiente ${
                                  ambiente.id_ambiente
                                }`}

                            </strong>

                          </td>

                          <td>

                            <span className="ambiente-description">

                              {ambiente.descripcion ||
                                "Sin descripción"}

                            </span>

                          </td>

                          <td className="number-value">
                            {ambiente.total}
                          </td>

                          <td className="good-value">
                            {ambiente.buenos}
                          </td>

                          <td className="damaged-value">
                            {ambiente.dañados}
                          </td>

                          <td className="off-value">
                            {ambiente.sinPrender}
                          </td>

                          <td>

                            <span
                              className={`general-status ${estado.clase}`}
                            >

                              {estado.clase ===
                                "operativo" ? (
                                <FaCheckCircle />
                              ) : (
                                <FaExclamationTriangle />
                              )}

                              {estado.texto}

                            </span>

                          </td>

                          <td>

                            <button
                              className="details-button"
                              onClick={() =>
                                navigate(
                                  `/dashboard-admin?ambiente=${ambiente.id_ambiente}`
                                )
                              }
                            >

                              <FaEye />

                              Ver detalles

                            </button>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              PIE DE TABLA
              ================================================= */}

          <div className="table-footer">

            <span>
              Mostrando{" "}
              {ambientesFiltrados.length} de{" "}
              {ambientes.length} ambientes
            </span>

            <div className="pagination">

              <button>
                <FaChevronLeft />
              </button>

              <button className="active-page">
                1
              </button>

              <button>
                <FaChevronRight />
              </button>

            </div>

          </div>

        </section>

      </main>

      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="ambientes-footer">

        <div className="footer-left">

          <strong>
            Data<span>Ventor</span>
          </strong>

          <span>
            Conocimiento que transforma
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
}

export default DashboardAmbientes;