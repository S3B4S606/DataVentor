
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaClipboardList,
  FaSearch,
  FaEye,
  FaSyncAlt,
} from "react-icons/fa";

import "../../styles/AdminCoordinador/GestionReportes.css";

type Reporte = {
  id_reporte: number;
  equipo: string;
  ambiente: string;
  sede: string;
  descripcion: string;
  estado: string;
  fecha: string;
  reportado_por: string;
};

const API_URL = "http://127.0.0.1:5000";

function GestionReportes() {
  const navigate = useNavigate();

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarReportes = async () => {
    setCargando(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch(`${API_URL}/api/reportes`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      if (!respuesta.ok) {
        throw new Error(
          `No se pudieron consultar los reportes (${respuesta.status}).`
        );
      }

      const datos = await respuesta.json();

      const lista = Array.isArray(datos)
        ? datos
        : Array.isArray(datos.reportes)
        ? datos.reportes
        : [];

      const reportesNormalizados: Reporte[] = lista.map(
        (r: any) => ({
          id_reporte: Number(r.id_reporte ?? r.id ?? 0),
          equipo: String(
            r.equipo?.modelo ??
            r.nombre_equipo ??
            r.modelo ??
            r.equipo ??
            "Sin equipo"
          ),
          ambiente: String(
            r.ambiente?.descripcion ??
            r.nombre_ambiente ??
            r.ambiente ??
            r.id_ambiente ??
            "Sin ambiente"
          ),
          sede: String(
            r.sede?.descripcion ??
            r.nombre_sede ??
            r.sede ??
            "Sin sede"
          ),
          descripcion: String(
            r.descripcion ??
            r.descripcion_problema ??
            r.observaciones ??
            "Sin descripción"
          ),
          estado: String(
            r.estado_reporte ??
            r.estado ??
            "pendiente"
          ),
          fecha: String(
            r.fecha_reporte ??
            r.fecha_creacion ??
            r.fecha ??
            ""
          ),
          reportado_por: String(
            r.reportado_por ??
            r.nombre_usuario ??
            r.usuario?.nombre ??
            "No especificado"
          ),
        })
      );

      setReportes(reportesNormalizados);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con DataVentor."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const normalizar = (valor: string) =>
    valor.toLowerCase().trim().replaceAll("_", " ");

  const reportesFiltrados = reportes.filter((reporte) => {
    const texto = normalizar(
      `${reporte.id_reporte} ${reporte.equipo} ${reporte.ambiente}
       ${reporte.sede} ${reporte.descripcion} ${reporte.reportado_por}`
    );

    const coincideBusqueda = texto.includes(normalizar(busqueda));

    const coincideEstado =
      filtroEstado === "todos" ||
      normalizar(reporte.estado) === normalizar(filtroEstado);

    return coincideBusqueda && coincideEstado;
  });

  const contar = (estado: string) =>
    reportes.filter(
      (r) => normalizar(r.estado) === normalizar(estado)
    ).length;

  const fechaBonita = (fecha: string) => {
    if (!fecha) return "Sin fecha";

    const fechaConvertida = new Date(fecha);

    return Number.isNaN(fechaConvertida.getTime())
      ? fecha
      : fechaConvertida.toLocaleDateString("es-CO");
  };

  const claseEstado = (estado: string) =>
    normalizar(estado).replaceAll(" ", "-");

  return (
    <div className="gestion-reportes-page">

      <header className="gestion-reportes-header">
        <div className="gestion-reportes-logo">
          <strong>
            Data<span>Ventor</span>
          </strong>
          <small>Gestión de equipos en ambientes SENA</small>
        </div>

        <button
          className="gestion-reportes-volver"
          onClick={() => navigate("/dashboard-admin")}
        >
          <FaArrowLeft />
          Volver al Dashboard
        </button>
      </header>

      <main className="gestion-reportes-content">

        <div className="gestion-reportes-titulo">
          <div>
            <h1>Gestión de reportes</h1>
            <p>
              Consulta y seguimiento de todos los reportes
              registrados en DataVentor.
            </p>
          </div>

          <button
            className="gestion-reportes-actualizar"
            onClick={cargarReportes}
            disabled={cargando}
          >
            <FaSyncAlt />
            Actualizar
          </button>
        </div>

        <div className="gestion-reportes-estadisticas">
          <div className="gestion-reportes-estadistica">
            <span>Total de reportes</span>
            <strong>{reportes.length}</strong>
          </div>

          <div className="gestion-reportes-estadistica">
            <span>Pendientes</span>
            <strong>{contar("pendiente")}</strong>
          </div>

          <div className="gestion-reportes-estadistica">
            <span>En revisión</span>
            <strong>{contar("en_revision")}</strong>
          </div>

          <div className="gestion-reportes-estadistica">
            <span>Resueltos</span>
            <strong>{contar("resuelto")}</strong>
          </div>
        </div>

        <section className="gestion-reportes-card">

          <div className="gestion-reportes-card-header">
            <div className="gestion-reportes-card-titulo">
              <div className="gestion-reportes-icono">
                <FaClipboardList />
              </div>

              <div>
                <h2>Todos los reportes</h2>
                <p>
                  Reportes realizados por aprendices e instructores.
                </p>
              </div>
            </div>

            <div className="gestion-reportes-filtros">
              <div className="gestion-reportes-buscador">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Buscar reporte..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_revision">En revisión</option>
                <option value="resuelto">Resueltos</option>
                <option value="cerrado">Cerrados</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="gestion-reportes-error" role="alert">
              {error}
            </div>
          )}

          <div className="gestion-reportes-tabla-contenedor">
            <table className="gestion-reportes-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipo</th>
                  <th>Ambiente</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Reportado por</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={8} className="gestion-reportes-vacio">
                      Cargando reportes...
                    </td>
                  </tr>
                ) : reportesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="gestion-reportes-vacio">
                      No se encontraron reportes.
                    </td>
                  </tr>
                ) : (
                  reportesFiltrados.map((reporte) => (
                    <tr key={reporte.id_reporte}>
                      <td>#{reporte.id_reporte}</td>

                      <td className="gestion-reportes-equipo">
                        {reporte.equipo}
                      </td>

                      <td>{reporte.ambiente}</td>

                      <td className="gestion-reportes-descripcion">
                        {reporte.descripcion}
                      </td>

                      <td>
                        <span
                          className={`gestion-reportes-estado ${claseEstado(
                            reporte.estado
                          )}`}
                        >
                          {normalizar(reporte.estado)}
                        </span>
                      </td>

                      <td>{fechaBonita(reporte.fecha)}</td>

                      <td>{reporte.reportado_por}</td>

                      <td>
                        <button
                          className="gestion-reportes-ver"
                          onClick={() =>
                            navigate(
                              `/detalle-reporte/${reporte.id_reporte}`
                            )
                          }
                        >
                          <FaEye />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="gestion-reportes-pie-tabla">
            Mostrando {reportesFiltrados.length} de {reportes.length} reportes
          </div>

        </section>
      </main>

      <footer className="gestion-reportes-footer">
        <div>
          <strong>
            Data<span>Ventor</span>
          </strong>
          <small>Conocimiento que transforma</small>
        </div>

        <div>
          <strong>SENA</strong>
          <small>
            Centro de Gestión de Mercados,
            Logística y Tecnologías de la Información
          </small>
        </div>
      </footer>

    </div>
  );
}

export default GestionReportes;
