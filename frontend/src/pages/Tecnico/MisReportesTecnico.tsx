
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Tecnico/MisReportesTecnico.css";
import { api } from "../../services/api";

interface ReporteTecnico {
  id_original: number;
  id: string;
  equipo: string;
  ambiente: string;
  fecha: string;
  estado: "Pendiente" | "En proceso" | "Resuelto";
  descripcion: string;
}

const mapearEstado = (
  estado: string
): ReporteTecnico["estado"] => {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "en_revision" || estado === "En proceso") {
    return "En proceso";
  }
  return "Resuelto";
};

const desmapearEstado = (
  estado: ReporteTecnico["estado"]
): "pendiente" | "en_revision" | "resuelto" => {
  if (estado === "Pendiente") return "pendiente";
  if (estado === "En proceso") return "en_revision";
  return "resuelto";
};

function MisReportesTecnico() {
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [reportes, setReportes] = useState<ReporteTecnico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState<Record<number, string>>(
    {}
  );

  const cargarReportes = async () => {
    try {
      setCargando(true);
      setError(null);

      const datos = await api.getReportes();

      const reportesFormateados: ReporteTecnico[] = datos.map((r) => ({
        id_original: r.id_reporte!,
        id: `#${String(r.id_reporte).padStart(3, "0")}`,
        equipo: r.modelo ?? r.serial ?? r.tipo ?? "Equipo",
        ambiente: r.id_ambiente !== undefined
          ? String(r.id_ambiente)
          : "Sin ambiente",
        fecha: r.fecha_reporte
          ? new Date(r.fecha_reporte).toLocaleDateString("es-CO")
          : "Sin fecha",
        estado: mapearEstado(r.estado_reporte ?? "pendiente"),
        descripcion: r.descripcion ?? "Sin descripción",
      }));

      setReportes(reportesFormateados);
    } catch (err) {
      console.error("Error al cargar reportes:", err);
      setError(
        "No se pudieron cargar los reportes. Verifica que el backend esté funcionando."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarReportes();
  }, []);

  const cambiarEstadoReporte = async (
    idOriginal: number,
    nuevoEstado: ReporteTecnico["estado"]
  ) => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      alert("No se encontró el usuario actual.");
      return;
    }

    let usuario: { id_usuario?: number };

    try {
      usuario = JSON.parse(usuarioGuardado);
    } catch {
      alert("No se pudieron leer los datos del usuario.");
      return;
    }

    if (!usuario.id_usuario) {
      alert("No se encontró el identificador del técnico.");
      return;
    }

    setActualizandoId(idOriginal);

    try {
      await api.actualizarEstadoReporte(idOriginal, {
        estado: desmapearEstado(nuevoEstado),
        id_usuario: usuario.id_usuario,
        observaciones: observaciones[idOriginal]?.trim() || undefined,
      });

      setReportes((anteriores) =>
        anteriores.map((reporte) =>
          reporte.id_original === idOriginal
            ? { ...reporte, estado: nuevoEstado }
            : reporte
        )
      );

      setObservaciones((anteriores) => ({
        ...anteriores,
        [idOriginal]: "",
      }));

      alert("Reporte actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar el reporte:", err);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el reporte."
      );
    } finally {
      setActualizandoId(null);
    }
  };

  const reportesFiltrados = reportes.filter((reporte) => {
    const coincideFiltro =
      filtro === "Todos" || reporte.estado === filtro;

    const texto = [
      reporte.id,
      reporte.equipo,
      reporte.ambiente,
      reporte.descripcion,
    ]
      .join(" ")
      .toLowerCase();

    return coincideFiltro && texto.includes(busqueda.toLowerCase());
  });

  const contarEstado = (estado: ReporteTecnico["estado"]) =>
    reportes.filter((reporte) => reporte.estado === estado).length;

  return (
    <div className="mis-reportes-page">
      <header className="reportes-header">
        <div className="marca-data-ventor">
          <h1>DataVentor</h1>
          <p>Gestión de equipos en ambientes SENA</p>
        </div>

        <nav className="menu-reportes">
          <button
            type="button"
            className="menu-inicio"
            onClick={() => navigate("/")}
          >
            Inicio
          </button>


          <button
            type="button"
            className="menu-salir"
            onClick={() => {
              localStorage.removeItem("usuario");
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        </nav>
      </header>

      <main className="reportes-container">
        <section className="intro-reportes">
          <div>
            <span className="section-label">GESTIÓN TÉCNICA</span>
            <h2>Mis reportes</h2>
            <p>
              Consulta los reportes, agrega observaciones y actualiza su estado.
            </p>
          </div>

          <div className="total-reportes">
            <span>Total</span>
            <strong>{reportes.length}</strong>
            <small>reportes registrados</small>
          </div>
        </section>

        <section className="resumen-reportes">
          <div className="resumen-item">
            <div className="resumen-icon pendiente-icon">!</div>
            <div>
              <span>Pendientes</span>
              <strong>{contarEstado("Pendiente")}</strong>
            </div>
          </div>

          <div className="resumen-item">
            <div className="resumen-icon proceso-icon">↻</div>
            <div>
              <span>En proceso</span>
              <strong>{contarEstado("En proceso")}</strong>
            </div>
          </div>

          <div className="resumen-item">
            <div className="resumen-icon resuelto-icon">✓</div>
            <div>
              <span>Resueltos</span>
              <strong>{contarEstado("Resuelto")}</strong>
            </div>
          </div>
        </section>

        <section className="herramientas-reportes">
          <div className="buscador">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Buscar por equipo, ID, ambiente o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filtros">
            {["Todos", "Pendiente", "En proceso", "Resuelto"].map((estado) => (
              <button
                type="button"
                key={estado}
                className={`filtro-btn ${filtro === estado ? "activo" : ""}`}
                onClick={() => setFiltro(estado)}
              >
                {estado}
              </button>
            ))}
          </div>
        </section>

        <section className="lista-reportes">
          <div className="lista-header">
            <div>
              <span className="section-label">REGISTROS</span>
              <h3>Reportes registrados</h3>
            </div>
            <span className="cantidad-resultados">
              {reportesFiltrados.length} resultados
            </span>
          </div>

          {cargando ? (
            <div className="sin-resultados">
              <p>Cargando reportes...</p>
            </div>
          ) : error ? (
            <div className="sin-resultados">
              <p>{error}</p>
              <button
                type="button"
                className="btn-reintentar"
                onClick={() => void cargarReportes()}
              >
                Intentar nuevamente
              </button>
            </div>
          ) : reportesFiltrados.length > 0 ? (
            <div className="reportes-lista">
              {reportesFiltrados.map((reporte) => (
                <article className="reporte-card" key={reporte.id_original}>
                  <div className="reporte-identificador">
                    <span>ID</span>
                    <strong>{reporte.id}</strong>
                  </div>

                  <div className="reporte-info-principal">
                    <div className="equipo-linea">
                      <h4>{reporte.equipo}</h4>

                      <span
                        className={`estado ${
                          reporte.estado === "Pendiente"
                            ? "estado-pendiente"
                            : reporte.estado === "En proceso"
                              ? "estado-proceso"
                              : "estado-resuelto"
                        }`}
                      >
                        <span className="estado-punto" />
                        {reporte.estado}
                      </span>
                    </div>

                    <div className="datos-reporte">
                      <span>Ambiente: {reporte.ambiente}</span>
                      <span>Fecha: {reporte.fecha}</span>
                    </div>

                    <p className="descripcion-original">
                      {reporte.descripcion}
                    </p>

                    <label
                      className="label-observaciones"
                      htmlFor={`observaciones-${reporte.id_original}`}
                    >
                      Observaciones del técnico
                    </label>

                    <textarea
                      id={`observaciones-${reporte.id_original}`}
                      className="campo-observaciones"
                      placeholder="Describe la revisión, el trabajo realizado o la solución..."
                      value={observaciones[reporte.id_original] ?? ""}
                      onChange={(e) =>
                        setObservaciones((anteriores) => ({
                          ...anteriores,
                          [reporte.id_original]: e.target.value,
                        }))
                      }
                      rows={3}
                      maxLength={2000}
                      disabled={actualizandoId === reporte.id_original}
                    />

                    <div className="acciones-reporte">
                      <label
                        htmlFor={`estado-${reporte.id_original}`}
                        className="label-estado"
                      >
                        Actualizar estado
                      </label>

                      <select
                        id={`estado-${reporte.id_original}`}
                        className={`estado-select ${
                          reporte.estado === "Pendiente"
                            ? "estado-pendiente"
                            : reporte.estado === "En proceso"
                              ? "estado-proceso"
                              : "estado-resuelto"
                        }`}
                        value={reporte.estado}
                        disabled={actualizandoId === reporte.id_original}
                        onChange={(e) =>
                          void cambiarEstadoReporte(
                            reporte.id_original,
                            e.target.value as ReporteTecnico["estado"]
                          )
                        }
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Resuelto">Resuelto</option>
                      </select>

                      {actualizandoId === reporte.id_original && (
                        <span className="mensaje-actualizando">
                          Guardando...
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-detalle"
                    onClick={() =>
                      navigate(`/detalle-reporte/${reporte.id_original}`)
                    }
                  >
                    Ver detalle <span>→</span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="sin-resultados">
              <div className="sin-resultados-icon">⌕</div>
              <h3>No encontramos reportes</h3>
              <p>Intenta cambiar los filtros o realizar otra búsqueda.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        © 2026 DataVentor | SENA
      </footer>
    </div>
  );
}

export default MisReportesTecnico;
