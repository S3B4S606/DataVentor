
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaClipboardList,
  FaSearch,
} from "react-icons/fa";

import "../../styles/Instructor/MisReportesInstructor.css";

interface Reporte {
  id: number;
  equipo: string;
  ambiente: string;
  tipo: string;
  prioridad: string;
  estado: string;
  fecha: string;
  descripcion: string;
}

const reportesEjemplo: Reporte[] = [
  {
    id: 1,
    equipo: "Computador 01",
    ambiente: "Ambiente 101",
    tipo: "Hardware",
    prioridad: "Alta",
    estado: "Pendiente",
    fecha: "16/10/2026",
    descripcion: "El equipo presenta problemas al encender.",
  },
  {
    id: 2,
    equipo: "Computador 02",
    ambiente: "Ambiente 102",
    tipo: "Software",
    prioridad: "Media",
    estado: "En revisión",
    fecha: "15/10/2026",
    descripcion: "El sistema operativo presenta errores.",
  },
];

export default function MisReportesInstructor() {
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] =
    useState<Reporte | null>(null);

  const reportesFiltrados = reportesEjemplo.filter((reporte) => {
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
      busqueda.toLowerCase()
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
            <p>Consulta y revisa el estado de tus reportes.</p>
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
              <option value="Solucionado">Solucionado</option>
            </select>
          </div>

          {reportesFiltrados.length === 0 ? (
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
            Datos demostrativos: estos reportes no provienen
            todavía del backend.
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
