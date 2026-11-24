
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaClipboardList,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import "../../styles/Instructor/MisReportesInstructor.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

interface ReporteAPI {
  id_reporte: number;
  id_usuario: number;
  registro_unico: string | null;
  numero_etiqueta?: number | null;
  tipo: string | null;
  modelo: string | null;
  ambiente: string;
  prioridad: string;
  estado_reporte: string;
  fecha_reporte: string;
  descripcion: string;
  nombre: string;
  apellido: string;
}

interface Reporte {
  id: number;
  equipo: string;
  ambiente: string;
  tipo: string;
  prioridad: string;
  estado: string;
  estadoClave: string;
  fecha: string;
  descripcion: string;
  responsable: string;
}

const estados: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

// ==========================================
// CONVERTIR DATOS DE POSTGRESQL
// ==========================================

function convertirReporte(r: ReporteAPI): Reporte {
  const fecha = new Date(r.fecha_reporte);

  const descripcionOriginal = String(
    r.descripcion || ""
  );

  const tipoDetectado = descripcionOriginal.match(
    /^\[([^\]]+)\]\s*/
  );

  const descripcionLimpia =
    descripcionOriginal.replace(
      /^\[[^\]]+\]\s*/,
      ""
    );

  const estadoClave = String(
    r.estado_reporte || "pendiente"
  ).toLowerCase();

  const prioridad = String(
    r.prioridad || "media"
  ).toLowerCase();

  let nombreEquipo =
    r.registro_unico ||
    (r.numero_etiqueta != null
      ? `Equipo ${r.numero_etiqueta}`
      : r.modelo || `ID ${r.id_reporte}`);

  if (r.tipo) {
    nombreEquipo = `${r.tipo} - ${nombreEquipo}`;
  }

  return {
    id: r.id_reporte,
    equipo: nombreEquipo,
    ambiente: r.ambiente || "Sin ambiente",
    tipo: tipoDetectado
      ? tipoDetectado[1]
      : "No especificado",
    prioridad:
      prioridad.charAt(0).toUpperCase() +
      prioridad.slice(1),
    estado:
      estados[estadoClave] ||
      estadoClave,
    estadoClave,
    fecha: Number.isNaN(fecha.getTime())
      ? "Sin fecha"
      : fecha.toLocaleDateString("es-CO"),
    descripcion: descripcionLimpia,
    responsable:
      `${r.nombre || ""} ${r.apellido || ""}`.trim() ||
      "Sin identificar",
  };
}

export default function MisReportesInstructor() {
  const navigate = useNavigate();

  const [reportes, setReportes] =
    useState<Reporte[]>([]);

  const [filtro, setFiltro] =
    useState("Todos");

  const [busqueda, setBusqueda] =
    useState("");

  const [seleccionado, setSeleccionado] =
    useState<Reporte | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // CONSULTAR REPORTES
  // ==========================================

  useEffect(() => {
    const controlador = new AbortController();

    const cargarReportes = async () => {
      setCargando(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const usuarioGuardado =
          localStorage.getItem("usuario");

        if (!token || !usuarioGuardado) {
          throw new Error(
            "Debes iniciar sesión como Instructor."
          );
        }

        const usuario = JSON.parse(usuarioGuardado);

        if (
          usuario.rol !== "instructor" ||
          !usuario.id_usuario
        ) {
          throw new Error(
            "No se pudo validar la sesión del Instructor."
          );
        }

        const idInstructor = Number(
          usuario.id_usuario
        );

        const respuesta = await fetch(
          `${API}/api/reportes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controlador.signal,
          }
        );

        if (!respuesta.ok) {
          throw new Error(
            "No fue posible consultar los reportes."
          );
        }

        const datos: ReporteAPI[] =
          await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error(
            "La respuesta del servidor no es válida."
          );
        }

        // Mostrar solamente los reportes
        // asociados al instructor autenticado.

        const reportesInstructor = datos.filter(
          (reporte) =>
            Number(reporte.id_usuario) ===
            idInstructor
        );

        if (!controlador.signal.aborted) {
          setReportes(
            reportesInstructor.map(convertirReporte)
          );
        }

      } catch (err) {
        if (controlador.signal.aborted) return;

        console.error(
          "Error al consultar reportes:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los reportes."
        );

      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarReportes();

    return () => controlador.abort();
  }, []);

  // ==========================================
  // FILTRAR REPORTES
  // ==========================================

  const reportesFiltrados = reportes.filter(
    (reporte) => {
      const coincideEstado =
        filtro === "Todos" ||
        reporte.estadoClave === filtro;

      const texto = [
        reporte.id,
        reporte.equipo,
        reporte.ambiente,
        reporte.tipo,
        reporte.descripcion,
      ]
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = texto.includes(
        busqueda.toLowerCase().trim()
      );

      return coincideEstado && coincideBusqueda;
    }
  );

  // ==========================================
  // CERRAR MODAL CON ESCAPE
  // ==========================================

  useEffect(() => {
    if (!seleccionado) return;

    const cerrarConEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSeleccionado(null);
      }
    };

    window.addEventListener(
      "keydown",
      cerrarConEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, [seleccionado]);

  return (
    <div className="mir-page">

      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <header className="mir-header">

        <div className="mir-brand">
          <h1>
            Data<span>Ventor</span>
          </h1>

          <p>
            Gestión de equipos en ambientes SENA
          </p>
        </div>

        <button
          type="button"
          className="mir-back"
          onClick={() =>
            navigate("/dashboard-instructor")
          }
        >
          <FaArrowLeft aria-hidden="true" />
          <span>Volver al tablero</span>
        </button>

      </header>

      {/* ======================================
          CONTENIDO
      ====================================== */}

      <main className="mir-main">

        {/* TÍTULO */}

        <section className="mir-heading">

          <div
            className="mir-heading-icon"
            aria-hidden="true"
          >
            <FaClipboardList />
          </div>

          <div className="mir-heading-text">
            <h2>Mis reportes</h2>

            <p>
              Consulta y revisa el estado de
              los reportes que has registrado.
            </p>
          </div>

        </section>

        {/* ======================================
            PANEL PRINCIPAL
        ====================================== */}

        <section className="mir-panel">

          {/* BUSCADOR Y FILTROS */}

          <div className="mir-toolbar">

            <div className="mir-search">
              <FaSearch aria-hidden="true" />

              <input
                type="search"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
                placeholder="Buscar equipo o ambiente..."
                aria-label="Buscar reportes"
              />
            </div>

            <select
              value={filtro}
              onChange={(e) =>
                setFiltro(e.target.value)
              }
              aria-label="Filtrar por estado"
            >
              <option value="Todos">
                Todos los estados
              </option>

              <option value="pendiente">
                Pendiente
              </option>

              <option value="en_revision">
                En revisión
              </option>

              <option value="resuelto">
                Resuelto
              </option>

              <option value="cerrado">
                Cerrado
              </option>
            </select>

          </div>

          {/* CONTADOR */}

          {!cargando && !error && (
            <p className="mir-count">
              {reportesFiltrados.length}{" "}
              {reportesFiltrados.length === 1
                ? "reporte encontrado"
                : "reportes encontrados"}
            </p>
          )}

          {/* CARGA */}

          {cargando ? (
            <div
              className="mir-empty"
              role="status"
            >
              Cargando reportes...
            </div>
          ) : error ? (
            <div
              className="mir-empty mir-load-error"
              role="alert"
            >
              {error}
            </div>
          ) : reportesFiltrados.length === 0 ? (
            <div className="mir-empty">
              {reportes.length === 0
                ? "Todavía no tienes reportes registrados."
                : "No se encontraron reportes con esos filtros."}
            </div>
          ) : (

            /* TABLA DE REPORTES */

            <div className="mir-table-wrap">
              <table className="mir-table">

                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>Ambiente</th>
                    <th>Fecha</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>

                <tbody>
                  {reportesFiltrados.map(
                    (reporte) => (
                      <tr key={reporte.id}>

                        <td data-label="Equipo">
                          {reporte.equipo}
                        </td>

                        <td data-label="Ambiente">
                          {reporte.ambiente}
                        </td>

                        <td data-label="Fecha">
                          {reporte.fecha}
                        </td>

                        <td data-label="Prioridad">
                          <span
                            className={
                              `mir-priority mir-priority-${reporte.prioridad.toLowerCase()}`
                            }
                          >
                            {reporte.prioridad}
                          </span>
                        </td>

                        <td data-label="Estado">
                          <span
                            className={
                              `mir-status mir-status-${reporte.estadoClave}`
                            }
                          >
                            {reporte.estado}
                          </span>
                        </td>

                        <td data-label="Detalle">
                          <button
                            type="button"
                            className="mir-detail"
                            onClick={() =>
                              setSeleccionado(reporte)
                            }
                          >
                            Ver detalle
                          </button>
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          )}

          {/* INFORMACIÓN */}

          <p className="mir-note">
            Reportes registrados en DataVentor.
          </p>

        </section>

        {/* ======================================
            MODAL DETALLE DEL REPORTE
        ====================================== */}

        {seleccionado && (
          <div className="mir-modal-backdrop">

            <section
              className="mir-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mir-modal-title"
            >

              <div className="mir-modal-header">

                <h3 id="mir-modal-title">
                  Detalle del reporte
                  {" "}#{seleccionado.id}
                </h3>

                <button
                  type="button"
                  className="mir-modal-close-icon"
                  onClick={() =>
                    setSeleccionado(null)
                  }
                  aria-label="Cerrar detalle"
                >
                  <FaTimes aria-hidden="true" />
                </button>

              </div>

              <div className="mir-modal-body">

                <p>
                  <strong>Equipo:</strong>{" "}
                  {seleccionado.equipo}
                </p>

                <p>
                  <strong>Ambiente:</strong>{" "}
                  {seleccionado.ambiente}
                </p>

                <p>
                  <strong>Tipo:</strong>{" "}
                  {seleccionado.tipo}
                </p>

                <p>
                  <strong>Fecha:</strong>{" "}
                  {seleccionado.fecha}
                </p>

                <p>
                  <strong>Prioridad:</strong>{" "}
                  {seleccionado.prioridad}
                </p>

                <p>
                  <strong>Estado:</strong>{" "}
                  {seleccionado.estado}
                </p>

                <p>
                  <strong>Registrado por:</strong>{" "}
                  {seleccionado.responsable}
                </p>

                <p>
                  <strong>Descripción:</strong>{" "}
                  {seleccionado.descripcion}
                </p>

              </div>

              <button
                type="button"
                className="mir-modal-close"
                onClick={() =>
                  setSeleccionado(null)
                }
              >
                Cerrar
              </button>

            </section>
          </div>
        )}

      </main>
    </div>
  );
}
