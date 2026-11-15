
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaClipboardList,
  FaSearch,
} from "react-icons/fa";

import "../../styles/Instructor/MisReportesInstructor.css";

const API = "http://127.0.0.1:5000";

interface ReporteAPI {
  id_reporte: number;
  id_usuario: number;
  registro_unico: string | null;
  tipo: string;
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

function convertirReporte(r: ReporteAPI): Reporte {
  const fecha = new Date(r.fecha_reporte);

  const tipoDetectado = r.descripcion.match(
    /^\[([^\]]+)\]\s*/
  );

  return {
    id: r.id_reporte,
    equipo: `${r.tipo} - ${r.registro_unico || r.modelo || r.id_reporte}`,
    ambiente: r.ambiente,
    tipo: tipoDetectado ? tipoDetectado[1] : "No especificado",
    prioridad:
      r.prioridad.charAt(0).toUpperCase() +
      r.prioridad.slice(1),
    estado:
      estados[r.estado_reporte] || r.estado_reporte,
    fecha: Number.isNaN(fecha.getTime())
      ? "Sin fecha"
      : fecha.toLocaleDateString("es-CO"),
    descripcion: r.descripcion.replace(
      /^\[[^\]]+\]\s*/,
      ""
    ),
    responsable: `${r.nombre} ${r.apellido}`,
  };
}

export default function MisReportesInstructor() {
  const navigate = useNavigate();

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] =
    useState<Reporte | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    const cargarReportes = async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          `${API}/api/reportes`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error(
            "No fue posible consultar los reportes."
          );
        }

        const datos: ReporteAPI[] = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error("La respuesta no es válida.");
        }

        if (!controlador.signal.aborted) {
          setReportes(datos.map(convertirReporte));
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          console.error("Error al consultar reportes:", err);
          setError("No se pudieron cargar los reportes.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarReportes();

    return () => controlador.abort();
  }, []);

  const reportesFiltrados = reportes.filter((reporte) => {
    const coincideEstado =
      filtro === "Todos" || reporte.estado === filtro;

    const texto = (
      reporte.equipo +
      " " +
      reporte.ambiente +
      " " +
      reporte.tipo
    ).toLowerCase();

    const coincideBusqueda = texto.includes(
      busqueda.toLowerCase().trim()
    );

    return coincideEstado && coincideBusqueda;
  });

  return (
    <div className="mir-page">
      <header className="mir-header">
        <div>
          <h1>DataVentor</h1>
          <p>Gestión de equipos en ambientes SENA</p>
        </div>

        <button
          type="button"
          className="mir-back"
          onClick={() => navigate("/dashboard-instructor")}
        >
          <FaArrowLeft />
          Volver al tablero
        </button>
      </header>

      <main className="mir-main">
        <section className="mir-heading">
          <div className="mir-heading-icon">
            <FaClipboardList />
          </div>

          <div>
            <h2>Mis reportes</h2>
            <p>Consulta y revisa el estado de los reportes.</p>
          </div>
        </section>

        <section className="mir-panel">
          <div className="mir-toolbar">
            <div className="mir-search">
              <FaSearch />

              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar equipo o ambiente..."
                aria-label="Buscar reportes"
              />
            </div>

            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En revisión">En revisión</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

          {cargando ? (
            <div className="mir-empty">
              Cargando reportes...
            </div>
          ) : error ? (
            <div className="mir-empty" role="alert">
              {error}
            </div>
          ) : reportesFiltrados.length === 0 ? (
            <div className="mir-empty">
              No se encontraron reportes con esos filtros.
            </div>
          ) : (
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
                  {reportesFiltrados.map((reporte) => (
                    <tr key={reporte.id}>
                      <td>{reporte.equipo}</td>
                      <td>{reporte.ambiente}</td>
                      <td>{reporte.fecha}</td>

                      <td>
                        <span
                          className={`mir-priority mir-priority-${reporte.prioridad.toLowerCase()}`}
                        >
                          {reporte.prioridad}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`mir-status mir-status-${reporte.estado
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {reporte.estado}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="mir-detail"
                          onClick={() => setSeleccionado(reporte)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mir-note">
            Reportes registrados en PostgreSQL.
            Vista general de pruebas: todavía no se
            filtran por instructor autenticado.
          </p>
        </section>

        {seleccionado && (
          <div className="mir-modal-backdrop">
            <section
              className="mir-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mir-modal-title"
            >
              <h3 id="mir-modal-title">
                Detalle del reporte #{seleccionado.id}
              </h3>

              <p>
                <strong>Equipo:</strong> {seleccionado.equipo}
              </p>

              <p>
                <strong>Ambiente:</strong> {seleccionado.ambiente}
              </p>

              <p>
                <strong>Tipo:</strong> {seleccionado.tipo}
              </p>

              <p>
                <strong>Fecha:</strong> {seleccionado.fecha}
              </p>

              <p>
                <strong>Prioridad:</strong> {seleccionado.prioridad}
              </p>

              <p>
                <strong>Estado:</strong> {seleccionado.estado}
              </p>

              <p>
                <strong>Registrado por:</strong>{" "}
                {seleccionado.responsable}
              </p>

              <p>
                <strong>Descripción:</strong>{" "}
                {seleccionado.descripcion}
              </p>

              <button
                type="button"
                onClick={() => setSeleccionado(null)}
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
