
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaClipboardList,
  FaLaptop,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaExclamationTriangle,
  FaHistory,
  FaSyncAlt,
} from "react-icons/fa";

import "../../styles/Tecnico/DetalleReporte.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

interface Reporte {
  id_reporte: number;
  id_equipo: number;
  descripcion: string;
  prioridad: string;
  estado_reporte: string;
  fecha_reporte: string;
  serial: string;
  registro_unico: string;
  tipo: string;
  modelo: string;
  estado_equipo: string;
  ambiente: string;
  sede: string;
  nombre: string;
  apellido: string;
  correo: string;
}

interface Historial {
  id_historial: number;
  estado: string;
  fecha: string;
  observaciones: string | null;
  nombre: string;
  apellido: string;
}

function DetalleReporte() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        setCargando(true);
        setError("");

        const [respuestaReporte, respuestaHistorial] =
          await Promise.all([
            fetch(`${API_URL}/api/reportes/${id}`),
            fetch(`${API_URL}/api/reportes/${id}/historial`),
          ]);

        if (!respuestaReporte.ok) {
          throw new Error("No fue posible consultar el reporte.");
        }

        if (!respuestaHistorial.ok) {
          throw new Error("No fue posible consultar el historial.");
        }

        const datosReporte: Reporte =
          await respuestaReporte.json();

        const datosHistorial: Historial[] =
          await respuestaHistorial.json();

        setReporte(datosReporte);
        setHistorial(
          Array.isArray(datosHistorial) ? datosHistorial : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar los datos."
        );
      } finally {
        setCargando(false);
      }
    };

    if (id && /^\d+$/.test(id)) {
      cargarDetalle();
    } else {
      setError("El identificador del reporte no es válido.");
      setCargando(false);
    }
  }, [id]);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "Sin fecha";

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return fecha;
    }

    return valor.toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearEstado = (estado?: string) => {
    const nombres: Record<string, string> = {
      pendiente: "Pendiente",
      en_revision: "En revisión",
      resuelto: "Resuelto",
      cerrado: "Cerrado",
      buen_estado: "Buen estado",
      mal_estado: "Mal estado",
    };

    return nombres[estado ?? ""] ??
      (estado || "No especificado");
  };

  const obtenerClaseEstado = (estado: string) => {
    if (estado === "pendiente") return "pendiente";
    if (estado === "en_revision") return "revision";
    if (estado === "resuelto") return "resuelto";
    if (estado === "cerrado") return "cerrado";
    return "";
  };

  return (
    <div className="detalle-reporte-page">

      <header className="detalle-reporte-header">
        <div className="detalle-reporte-logo">
          <h1>
            Data<span>Ventor</span>
          </h1>
          <p>Gestión de equipos en ambientes SENA</p>
        </div>

        <button
          type="button"
          className="detalle-reporte-volver"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Volver
        </button>
      </header>

      <main className="detalle-reporte-contenido">

        {cargando ? (
          <div className="detalle-reporte-mensaje">
            <FaSyncAlt />
            <p>Cargando información del reporte...</p>
          </div>
        ) : error ? (
          <div className="detalle-reporte-mensaje" role="alert">
            <FaExclamationTriangle />
            <p>{error}</p>

            <button
              type="button"
              onClick={() => navigate("/dashboard-tecnico")}
            >
              Volver al Dashboard
            </button>
          </div>
        ) : reporte ? (
          <>
            <div className="detalle-reporte-introduccion">
              <div>
                <span className="detalle-reporte-etiqueta">
                  GESTIÓN TÉCNICA
                </span>

                <h2>
                  Detalle del reporte #{reporte.id_reporte}
                </h2>

                <p>
                  Consulta la información y el seguimiento
                  de la novedad registrada.
                </p>
              </div>

              <span
                className={`detalle-reporte-estado ${obtenerClaseEstado(
                  reporte.estado_reporte
                )}`}
              >
                {formatearEstado(reporte.estado_reporte)}
              </span>
            </div>

            <div className="detalle-reporte-grid">

              <section className="detalle-reporte-card">
                <div className="detalle-reporte-card-titulo">
                  <FaClipboardList />
                  <h3>Información del reporte</h3>
                </div>

                <div className="detalle-reporte-datos">
                  <div>
                    <span>Número de reporte</span>
                    <strong>#{reporte.id_reporte}</strong>
                  </div>

                  <div>
                    <span>Prioridad</span>
                    <strong className="detalle-reporte-prioridad">
                      {reporte.prioridad}
                    </strong>
                  </div>

                  <div>
                    <span>Estado actual</span>
                    <strong>
                      {formatearEstado(reporte.estado_reporte)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      <FaCalendarAlt /> Fecha
                    </span>
                    <strong>
                      {formatearFecha(reporte.fecha_reporte)}
                    </strong>
                  </div>
                </div>

                <div className="detalle-reporte-descripcion">
                  <h4>Descripción del problema</h4>
                  <p>{reporte.descripcion}</p>
                </div>
              </section>

              <section className="detalle-reporte-card">
                <div className="detalle-reporte-card-titulo">
                  <FaLaptop />
                  <h3>Información del equipo</h3>
                </div>

                <div className="detalle-reporte-datos">
                  <div>
                    <span>Modelo</span>
                    <strong>{reporte.modelo}</strong>
                  </div>

                  <div>
                    <span>Tipo de equipo</span>
                    <strong>{reporte.tipo}</strong>
                  </div>

                  <div>
                    <span>Serial</span>
                    <strong>{reporte.serial}</strong>
                  </div>

                  <div>
                    <span>Registro único</span>
                    <strong>{reporte.registro_unico}</strong>
                  </div>

                  <div>
                    <span>Estado del equipo</span>
                    <strong>
                      {formatearEstado(reporte.estado_equipo)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      <FaMapMarkerAlt /> Sede
                    </span>
                    <strong>{reporte.sede}</strong>
                  </div>

                  <div>
                    <span>Ambiente</span>
                    <strong>{reporte.ambiente}</strong>
                  </div>
                </div>
              </section>

              <section className="detalle-reporte-card">
                <div className="detalle-reporte-card-titulo">
                  <FaUser />
                  <h3>Registrado por</h3>
                </div>

                <div className="detalle-reporte-datos">
                  <div>
                    <span>Usuario</span>
                    <strong>
                      {reporte.nombre} {reporte.apellido}
                    </strong>
                  </div>

                  <div>
                    <span>Correo</span>
                    <strong>
                      {reporte.correo}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="detalle-reporte-card">
                <div className="detalle-reporte-card-titulo">
                  <FaHistory />
                  <h3>Historial del reporte</h3>
                </div>

                {historial.length === 0 ? (
                  <p className="detalle-reporte-sin-historial">
                    Este reporte todavía no tiene movimientos
                    registrados en el historial.
                  </p>
                ) : (
                  <div className="detalle-reporte-historial">
                    {historial.map((movimiento) => (
                      <div
                        key={movimiento.id_historial}
                        className="detalle-reporte-movimiento"
                      >
                        <span className="detalle-reporte-punto" />

                        <div>
                          <strong>
                            {formatearEstado(movimiento.estado)}
                          </strong>

                          <small>
                            {formatearFecha(movimiento.fecha)}
                          </small>

                          <p>
                            {movimiento.observaciones ||
                              "Sin observaciones."}
                          </p>

                          <small>
                            Responsable: {movimiento.nombre}{" "}
                            {movimiento.apellido}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>

            <div className="detalle-reporte-acciones">
              <button
                type="button"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft />
                Volver a reportes
              </button>
            </div>
          </>
        ) : null}

      </main>

      <footer className="detalle-reporte-footer">
        <strong>
          Data<span>Ventor</span>
        </strong>

        <span>
          SENA | Gestión de equipos en ambientes de formación
        </span>
      </footer>

    </div>
  );
}

export default DetalleReporte;
