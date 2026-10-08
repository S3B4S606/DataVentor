import { useEffect, useMemo, useState } from "react";
import {
  FaHome,
  FaBuilding,
  FaCalendarAlt,
  FaUser,
  FaSignOutAlt,
  FaLaptop,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPowerOff,
  FaFileAlt,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../../styles/AdminCoordinador/DashboardAdmin.css";

const API_URL = "http://127.0.0.1:5001";

interface Equipo {
  id_equipo?: number;
  id_ambiente?: number;
  serial?: string;
  registro_unico?: string;
  tipo?: string;
  modelo?: string;
  estado?: string;
  estado_equipo?: string;
}

interface Ambiente {
  id_ambiente?: number;
  nombre?: string;
  descripcion?: string;
  id_sede?: number;
}

interface Reporte {
  id_reporte: number;
  id_usuario?: number;
  id_equipo?: number;
  descripcion?: string;
  prioridad?: string;
  estado_reporte?: string;
  fecha_reporte?: string;
  nombre?: string;
  apellido?: string;
  serial?: string;
  modelo?: string;
  tipo?: string;
}

function DashboardAdmin() {
  const navigate = useNavigate();

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);

  const [ambienteSeleccionado, setAmbienteSeleccionado] =
    useState<string>("");

  const [cargando, setCargando] = useState(true);

  /* =====================================================
     CARGAR INFORMACIÓN
     ===================================================== */

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [
          equiposResponse,
          ambientesResponse,
          reportesResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/equipos`),
          fetch(`${API_URL}/api/ambientes`),
          fetch(`${API_URL}/api/reportes`),
        ]);

        const equiposData = await equiposResponse.json();
        const ambientesData = await ambientesResponse.json();
        const reportesData = await reportesResponse.json();

        if (!equiposResponse.ok) {
          throw new Error(
            equiposData?.mensaje ||
              "No se pudieron cargar los equipos."
          );
        }

        if (!ambientesResponse.ok) {
          throw new Error(
            ambientesData?.mensaje ||
              "No se pudieron cargar los ambientes."
          );
        }

        if (!reportesResponse.ok) {
          throw new Error(
            reportesData?.mensaje ||
              "No se pudieron cargar los reportes."
          );
        }

        const equiposLista = Array.isArray(equiposData)
          ? equiposData
          : [];

        const ambientesLista = Array.isArray(ambientesData)
          ? ambientesData
          : [];

        const reportesLista = Array.isArray(reportesData)
          ? reportesData
          : [];

        setEquipos(equiposLista);
        setAmbientes(ambientesLista);
        setReportes(reportesLista);

        if (ambientesLista.length > 0) {
          setAmbienteSeleccionado(
            String(ambientesLista[0].id_ambiente ?? "")
          );
        }
      } catch (error) {
        console.error(
          "Error cargando Dashboard Admin:",
          error
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  /* =====================================================
     AMBIENTE SELECCIONADO
     ===================================================== */

  const ambienteActual = useMemo(() => {
    return ambientes.find(
      (ambiente) =>
        String(ambiente.id_ambiente) ===
        ambienteSeleccionado
    );
  }, [ambientes, ambienteSeleccionado]);

  /* =====================================================
     EQUIPOS DEL AMBIENTE
     ===================================================== */

  const equiposDelAmbiente = useMemo(() => {
    if (!ambienteSeleccionado) {
      return equipos;
    }

    return equipos.filter(
      (equipo) =>
        String(equipo.id_ambiente) ===
        ambienteSeleccionado
    );
  }, [equipos, ambienteSeleccionado]);

  /* =====================================================
     ESTADO DE EQUIPOS
     ===================================================== */

  const obtenerEstado = (equipo: Equipo) => {
    return String(
      equipo.estado_equipo ??
        equipo.estado ??
        ""
    ).toLowerCase();
  };

  const estadisticas = useMemo(() => {
    let buenos = 0;
    let dañados = 0;
    let sinPrender = 0;

    equiposDelAmbiente.forEach((equipo) => {
      const estado = obtenerEstado(equipo);

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
      total: equiposDelAmbiente.length,
      buenos,
      dañados,
      sinPrender,
    };
  }, [equiposDelAmbiente]);

  /* =====================================================
     REPORTES DEL AMBIENTE
     ===================================================== */

  const reportesRecientes = useMemo(() => {
    let reportesFiltrados = reportes;

    if (ambienteSeleccionado) {
      const idsEquipos = equiposDelAmbiente
        .map((equipo) => equipo.id_equipo)
        .filter(
          (id): id is number =>
            typeof id === "number"
        );

      reportesFiltrados = reportes.filter((reporte) =>
        idsEquipos.includes(reporte.id_equipo ?? -1)
      );
    }

    return [...reportesFiltrados]
      .sort((a, b) => {
        const fechaA =
          new Date(
            a.fecha_reporte || ""
          ).getTime() || 0;

        const fechaB =
          new Date(
            b.fecha_reporte || ""
          ).getTime() || 0;

        return fechaB - fechaA;
      })
      .slice(0, 5);
  }, [
    reportes,
    ambienteSeleccionado,
    equiposDelAmbiente,
  ]);

  /* =====================================================
     FECHA
     ===================================================== */

  const fechaActual = new Date().toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "--/--/----";

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return fecha;
    }

    return fechaObjeto.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     ESTADO DEL REPORTE
     ===================================================== */

  const obtenerEstadoReporte = (
    estado?: string
  ) => {
    const valor = String(
      estado || ""
    ).toLowerCase();

    if (valor === "pendiente") {
      return {
        texto: "Pendiente",
        clase: "pendiente",
      };
    }

    if (valor === "en_revision") {
      return {
        texto: "En revisión",
        clase: "revision",
      };
    }

    if (valor === "resuelto") {
      return {
        texto: "Resuelto",
        clase: "bueno",
      };
    }

    if (valor === "cerrado") {
      return {
        texto: "Cerrado",
        clase: "bueno",
      };
    }

    return {
      texto: estado || "Sin estado",
      clase: "default",
    };
  };

  /* =====================================================
     CERRAR SESIÓN
     ===================================================== */

  const cerrarSesion = () => {
    navigate("/login");
  };

  return (
    <div className="dashboard-admin">
      {/* =================================================
          HEADER
          ================================================= */}

      <header className="admin-header">

        <div className="admin-logo">
          <div className="logo-mark">
            <span />
          </div>

          <div className="logo-text">
            <strong>
              Data<span>Ventor</span>
            </strong>

            <small>
              Gestión de equipos en ambientes SENA
            </small>
          </div>
        </div>

        <nav className="admin-navigation">

          <button
            className="nav-link active"
            onClick={() =>
              navigate("/dashboard-admin")
            }
          >
            <FaHome />
            Inicio
          </button>

          <button
            className="nav-link"
            onClick={() =>
              navigate("/ambientes")
            }
          >
            <FaFileAlt />
            Ambientes
          </button>

        </nav>

        <div className="admin-header-right">

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

      <main className="admin-content">

        {/* ===============================================
            FILTROS SUPERIORES
            =============================================== */}

        <section className="filters">

          {/* SEDE */}

          <div className="filter-card">

            <div className="filter-icon blue">
              <FaBuilding />
            </div>

            <div className="filter-info">
              <span>Sede</span>
              <strong>
                Centro de Gestión
              </strong>
            </div>

          </div>

          {/* AMBIENTE */}

          <div className="filter-card">

            <div className="filter-icon purple">
              <FaBuilding />
            </div>

            <div className="filter-info select-info">
              <span>Ambiente</span>

              <select
                value={ambienteSeleccionado}
                onChange={(e) =>
                  setAmbienteSeleccionado(
                    e.target.value
                  )
                }
              >
                {ambientes.length === 0 ? (
                  <option value="">
                    Sin ambientes
                  </option>
                ) : (
                  ambientes.map(
                    (ambiente) => (
                      <option
                        key={
                          ambiente.id_ambiente
                        }
                        value={
                          ambiente.id_ambiente
                        }
                      >
                        {ambiente.nombre ||
                          `Ambiente ${ambiente.id_ambiente}`}
                      </option>
                    )
                  )
                )}
              </select>

              <FaChevronDown className="select-arrow" />
            </div>

          </div>

          {/* FECHA */}

          <div className="filter-card">

            <div className="filter-icon blue">
              <FaCalendarAlt />
            </div>

            <div className="filter-info">
              <span>Fecha</span>
              <strong>{fechaActual}</strong>
            </div>

          </div>

          {/* COORDINADOR */}

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

        {/* ===============================================
            CUERPO PRINCIPAL
            =============================================== */}

        <section className="dashboard-grid">

          {/* =============================================
              IZQUIERDA
              ============================================= */}

          <div className="left-column">

            {/* INFORMACIÓN DEL AMBIENTE */}

            <article className="environment-card">

              <div className="environment-header">

                <div className="environment-title">

                  <div className="environment-icon">
                    <FaLaptop />
                  </div>

                  <div>
                    <h2>
                      Información del ambiente
                    </h2>

                    <p>
                      Resumen del estado de los
                      equipos
                    </p>
                  </div>

                </div>

                <div className="environment-number">

                  <span>
                    N.º DEL AMBIENTE
                  </span>

                  <strong>
                    {ambienteActual?.id_ambiente ??
                      "--"}
                  </strong>

                </div>

              </div>

            </article>

            {/* ESTADOS */}

            <article className="equipment-status-card">

              <div className="status-row total">

                <div className="status-left">
                  <div className="status-icon">
                    <FaLaptop />
                  </div>

                  <span>
                    Total de equipos
                  </span>
                </div>

                <strong>
                  {cargando
                    ? "..."
                    : estadisticas.total}
                </strong>

              </div>

              <div className="status-row good">

                <div className="status-left">
                  <div className="status-icon">
                    <FaCheckCircle />
                  </div>

                  <span>
                    Equipos buenos
                  </span>
                </div>

                <strong>
                  {cargando
                    ? "..."
                    : estadisticas.buenos}
                </strong>

              </div>

              <div className="status-row damaged">

                <div className="status-left">
                  <div className="status-icon">
                    <FaExclamationTriangle />
                  </div>

                  <span>
                    Equipos dañados
                  </span>
                </div>

                <strong>
                  {cargando
                    ? "..."
                    : estadisticas.dañados}
                </strong>

              </div>

              <div className="status-row off">

                <div className="status-left">
                  <div className="status-icon">
                    <FaPowerOff />
                  </div>

                  <span>
                    Equipos sin prender
                  </span>
                </div>

                <strong>
                  {cargando
                    ? "..."
                    : estadisticas.sinPrender}
                </strong>

              </div>

            </article>

          </div>

          {/* =============================================
              DERECHA - REPORTES
              ============================================= */}

          <article className="reports-card">

            <div className="reports-header">

              <div className="reports-title">

                <div className="reports-icon">
                  <FaFileAlt />
                </div>

                <div>
                  <h2>
                    Últimos 5 reportes
                  </h2>

                  <p>
                    Reportes más recientes del
                    ambiente seleccionado.
                  </p>
                </div>

              </div>

              <button
                className="view-all"
                onClick={() =>
                  navigate("/reportes-admin")
                }
              >
                Ver todos
                <FaChevronRight />
              </button>

            </div>

            <div className="reports-table-wrapper">

              <table className="reports-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Equipo</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Reportado por</th>
                  </tr>
                </thead>

                <tbody>

                  {cargando ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="empty-table"
                      >
                        Cargando información...
                      </td>
                    </tr>
                  ) : reportesRecientes.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="empty-table"
                      >
                        No hay reportes registrados.
                      </td>
                    </tr>
                  ) : (
                    reportesRecientes.map(
                      (reporte, index) => {

                        const estado =
                          obtenerEstadoReporte(
                            reporte.estado_reporte
                          );

                        const equipo =
                          reporte.modelo ||
                          reporte.serial ||
                          `PC-${String(
                            reporte.id_equipo ??
                              0
                          ).padStart(3, "0")}`;

                        const usuario =
                          reporte.nombre
                            ? `${reporte.nombre} ${
                                reporte.apellido ||
                                ""
                              }`
                            : `Usuario #${
                                reporte.id_usuario ??
                                "-"
                              }`;

                        return (
                          <tr
                            key={
                              reporte.id_reporte
                            }
                          >

                            <td className="number-cell">
                              {index + 1}
                            </td>

                            <td>
                              <strong className="equipment-code">
                                {equipo}
                              </strong>
                            </td>

                            <td>
                              <span className="description">
                                {reporte.descripcion ||
                                  "Sin descripción"}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`report-status ${estado.clase}`}
                              >
                                {estado.texto}
                              </span>
                            </td>

                            <td className="date-cell">
                              {formatearFecha(
                                reporte.fecha_reporte
                              )}
                            </td>

                            <td>
                              <span className="reported-user">
                                {usuario}
                              </span>
                            </td>

                          </tr>
                        );
                      }
                    )
                  )}

                </tbody>

              </table>

            </div>

          </article>

        </section>

      </main>

      {/* =================================================
          FRASE
          ================================================= */}

      <div className="sena-phrase">
        Tecnología que impulsa aprendizajes
      </div>

      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="admin-footer">

        <div className="footer-left">

          <strong>
            Data<span>Ventor</span>
          </strong>

          <span>
            Conocimiento que transforma
          </span>

        </div>

        <div className="footer-right">

          <strong>SENA</strong>

          <span>
            Centro de Gestión de Mercados,
            Logística y Tecnologías de la Información
          </span>

        </div>

      </footer>

    </div>
  );
}

export default DashboardAdmin;