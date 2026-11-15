
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

const API_URL = "http://127.0.0.1:5000";
const POR_PAGINA = 5;

interface Sede {
  id_sede: number;
  descripcion: string;
}

interface Equipo {
  id_equipo: number;
  id_ambiente: number;
  estado: string;
  estado_equipo?: string;
}

interface Ambiente {
  id_ambiente: number;
  id_sede: number;
  nombre?: string;
  descripcion: string;
  sede?: string;
}

interface AmbienteConEstadisticas extends Ambiente {
  total: number;
  buenos: number;
  dañados: number;
  sinPrender: number;
  enRevision: number;
}

function DashboardAmbientes() {
  const navigate = useNavigate();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [sedeSeleccionada, setSedeSeleccionada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const respuestas = await Promise.all([
          fetch(`${API_URL}/api/sedes`, {
            signal: controlador.signal,
          }),
          fetch(`${API_URL}/api/ambientes`, {
            signal: controlador.signal,
          }),
          fetch(`${API_URL}/api/equipos`, {
            signal: controlador.signal,
          }),
        ]);

        if (respuestas.some((r) => !r.ok)) {
          throw new Error(
            "No fue posible consultar los datos del backend."
          );
        }

        const [sedesData, ambientesData, equiposData] =
          await Promise.all(
            respuestas.map((r) => r.json())
          );

        if (
          !Array.isArray(sedesData) ||
          !Array.isArray(ambientesData) ||
          !Array.isArray(equiposData)
        ) {
          throw new Error("La respuesta del backend no es válida.");
        }

        if (!controlador.signal.aborted) {
          setSedes(sedesData);
          setAmbientes(ambientesData);
          setEquipos(equiposData);
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          console.error("Error al consultar datos:", err);
          setError(
            "No fue posible cargar los ambientes. Verifica FastAPI."
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => controlador.abort();
  }, []);

  const ambientesConEstadisticas = useMemo<
    AmbienteConEstadisticas[]
  >(() => {
    return ambientes.map((ambiente) => {
      const equiposAmbiente = equipos.filter(
        (equipo) =>
          Number(equipo.id_ambiente) ===
          Number(ambiente.id_ambiente)
      );

      let buenos = 0;
      let dañados = 0;
      let enRevision = 0;

      equiposAmbiente.forEach((equipo) => {
        const estado = String(
          equipo.estado_equipo || equipo.estado || ""
        ).toLowerCase();

        if (estado === "buen_estado") {
          buenos++;
        } else if (estado === "mal_estado") {
          dañados++;
        } else if (estado === "en_revision") {
          enRevision++;
        }
      });

      return {
        ...ambiente,
        total: equiposAmbiente.length,
        buenos,
        dañados,
        sinPrender: 0,
        enRevision,
      };
    });
  }, [ambientes, equipos]);

  const ambientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return ambientesConEstadisticas.filter((ambiente) => {
      const coincideSede =
        !sedeSeleccionada ||
        String(ambiente.id_sede) === sedeSeleccionada;

      const contenido = [
        ambiente.nombre,
        ambiente.descripcion,
        ambiente.sede,
        ambiente.id_ambiente,
      ]
        .join(" ")
        .toLowerCase();

      return coincideSede && contenido.includes(texto);
    });
  }, [ambientesConEstadisticas, busqueda, sedeSeleccionada]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(ambientesFiltrados.length / POR_PAGINA)
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const ambientesPagina = ambientesFiltrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  const obtenerEstadoGeneral = (
    ambiente: AmbienteConEstadisticas
  ) => {
    if (
      ambiente.dañados > 0 ||
      ambiente.enRevision > 0 ||
      ambiente.sinPrender > 0
    ) {
      return {
        texto: "Con novedades",
        clase: "novedades",
      };
    }

    if (ambiente.total === 0) {
      return {
        texto: "Sin equipos",
        clase: "novedades",
      };
    }

    return {
      texto: "Operativo",
      clase: "operativo",
    };
  };

  const fechaActual = new Date().toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    navigate("/");
  };

  return (
    <div className="dashboard-ambientes">
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
            type="button"
            className="nav-link"
            onClick={() => navigate("/dashboard-admin")}
          >
            <FaHome />
            Inicio
          </button>

          <button
            type="button"
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
              <strong>Coordinador</strong>
              <small>Centro de Gestión</small>
            </div>
          </div>

          <div className="header-separator" />

          <button
            type="button"
            className="logout"
            onClick={cerrarSesion}
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="ambientes-content">
        <section className="ambientes-filters">
          <div className="filter-card">
            <div className="filter-icon blue">
              <FaBuilding />
            </div>
            <div className="filter-info">
              <span>Sede</span>
              <select
                aria-label="Seleccionar sede"
                value={sedeSeleccionada}
                onChange={(e) => {
                  setSedeSeleccionada(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todas las sedes</option>
                {sedes.map((sede) => (
                  <option
                    key={sede.id_sede}
                    value={sede.id_sede}
                  >
                    {sede.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-card">
            <div className="filter-icon purple">
              <FaMapMarkerAlt />
            </div>
            <div className="filter-info">
              <span>Ambiente</span>
              <strong>
                {ambientesFiltrados.length} ambientes
              </strong>
            </div>
          </div>

          <div className="filter-card">
            <div className="filter-icon blue">
              <FaCalendarAlt />
            </div>
            <div className="filter-info">
              <span>Fecha</span>
              <strong>{fechaActual}</strong>
            </div>
          </div>

          <div className="filter-card">
            <div className="filter-icon purple">
              <FaUser />
            </div>
            <div className="filter-info">
              <span>Coordinador</span>
              <strong>Coordinador</strong>
            </div>
          </div>
        </section>

        <section className="ambientes-list-card">
          <div className="list-header">
            <div className="list-title">
              <div className="list-icon">
                <FaMapMarkerAlt />
              </div>
              <div>
                <h1>Lista de ambientes</h1>
                <p>
                  Consulta los ambientes y el estado de sus equipos.
                </p>
              </div>
            </div>

            <div className="list-actions">
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Buscar ambiente..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                />
              </div>

              <button
                type="button"
                className="add-button"
                onClick={() =>
                  navigate("/registrar-ambiente")
                }
              >
                <FaPlus />
                Agregar ambiente
              </button>
            </div>
          </div>

          <div className="ambientes-table-wrapper">
            <table className="ambientes-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ambiente</th>
                  <th>Descripción</th>
                  <th>Total equipos</th>
                  <th>Buenos</th>
                  <th>Dañados</th>
                  <th>Sin prender</th>
                  <th>Estado general</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cargando || error ? (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      {cargando
                        ? "Cargando ambientes..."
                        : error}
                    </td>
                  </tr>
                ) : ambientesPagina.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      No se encontraron ambientes.
                    </td>
                  </tr>
                ) : (
                  ambientesPagina.map((ambiente, index) => {
                    const estado =
                      obtenerEstadoGeneral(ambiente);

                    const nombre =
                      ambiente.nombre ||
                      ambiente.descripcion;

                    return (
                      <tr key={ambiente.id_ambiente}>
                        <td className="number-cell">
                          {(paginaActual - 1) * POR_PAGINA +
                            index +
                            1}
                        </td>

                        <td>
                          <strong className="ambiente-name">
                            {nombre}
                          </strong>
                        </td>

                        <td>
                          <span className="ambiente-description">
                            {ambiente.descripcion}
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
                            {estado.clase === "operativo" ? (
                              <FaCheckCircle />
                            ) : (
                              <FaExclamationTriangle />
                            )}
                            {estado.texto}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
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
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Mostrando {ambientesPagina.length} de{" "}
              {ambientesFiltrados.length} ambientes
            </span>

            <div className="pagination">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() =>
                  setPagina((p) => Math.max(1, p - 1))
                }
              >
                <FaChevronLeft />
              </button>

              <button
                type="button"
                className="active-page"
              >
                {paginaActual}
              </button>

              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() =>
                  setPagina((p) =>
                    Math.min(totalPaginas, p + 1)
                  )
                }
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="ambientes-footer">
        <div className="footer-left">
          <strong>
            Data<span>Ventor</span>
          </strong>
          <span>Conocimiento que transforma</span>
        </div>

        <div className="footer-right">
          <strong>SENA</strong>
          <span>
            Centro de Gestión de Mercados, Logística y
            Tecnologías de la Información
          </span>
        </div>
      </footer>
    </div>
  );
}

export default DashboardAmbientes;
