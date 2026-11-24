
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import "../../styles/Aprendiz/CrearReporte.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

// ==========================================
// INTERFACES
// ==========================================

interface Sede {
  id_sede: number;
  descripcion: string;
}

interface Ambiente {
  id_ambiente: number;
  id_sede: number;
  descripcion: string;
}

interface Equipo {
  id_equipo: number;
  id_ambiente: number;
  serial: string | null;
  registro_unico: string | null;
  tipo: string;
  modelo: string;
  numero_etiqueta?: number | null;
}

interface DatosFormulario {
  sede: string;
  ambiente: string;
  equipo: string;
  numeroComputador: string;
  tipoProblema: string;
  estado: string;
  prioridad: string;
  descripcion: string;
  evidencia: File | null;
}

// ==========================================
// COMPONENTE
// ==========================================

export default function CrearReporte() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reportarOtroEquipo =
    searchParams.get("otro") === "1";

  const [form, setForm] = useState<DatosFormulario>({
    sede: "",
    ambiente: "",
    equipo: "",
    numeroComputador: "",
    tipoProblema: "",
    estado: "En mal estado",
    prioridad: "Media",
    descripcion: "",
    evidencia: null,
  });

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [reporteGuardado, setReporteGuardado] =
    useState(false);

  // ==========================================
  // CARGAR DATOS DESDE POSTGRESQL
  // ==========================================

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      setCargando(true);
      setMensaje("");

      try {
        const [resSedes, resAmbientes, resEquipos] =
          await Promise.all([
            fetch(`${API_URL}/api/sedes`),
            fetch(`${API_URL}/api/ambientes`),
            fetch(`${API_URL}/api/equipos`),
          ]);

        if (
          !resSedes.ok ||
          !resAmbientes.ok ||
          !resEquipos.ok
        ) {
          throw new Error(
            "No fue posible cargar los datos del sistema."
          );
        }

        const datosSedes: Sede[] =
          await resSedes.json();

        const datosAmbientes: Ambiente[] =
          await resAmbientes.json();

        const datosEquipos: Equipo[] =
          await resEquipos.json();

        if (!activo) return;

        setSedes(datosSedes);
        setAmbientes(datosAmbientes);
        setEquipos(datosEquipos);

        if (reportarOtroEquipo) {
          // No utilizar el computador detectado.
          setForm((prev) => ({
            ...prev,
            sede: "",
            ambiente: "",
            equipo: "",
            numeroComputador: "",
          }));
        } else {
          // Reporte del computador detectado.
          const codigoEquipo = localStorage
            .getItem("equipoAsignado")
            ?.trim();

          const equipoDetectado =
            datosEquipos.find(
              (equipo) =>
                equipo.registro_unico === codigoEquipo
            );

          if (equipoDetectado) {
            const ambienteDetectado =
              datosAmbientes.find(
                (ambiente) =>
                  ambiente.id_ambiente ===
                  equipoDetectado.id_ambiente
              );

            if (ambienteDetectado) {
              setForm((prev) => ({
                ...prev,
                sede: String(
                  ambienteDetectado.id_sede
                ),
                ambiente: String(
                  ambienteDetectado.id_ambiente
                ),
                equipo: String(
                  equipoDetectado.id_equipo
                ),
              }));
            }
          } else if (codigoEquipo) {
            setMensaje(
              "El equipo detectado no está registrado."
            );
          }
        }
      } catch (error) {
        if (!activo) return;

        console.error(
          "Error cargando datos:",
          error
        );

        setMensaje(
          "No fue posible cargar las sedes, " +
          "ambientes y equipos. Verifica el backend."
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [reportarOtroEquipo]);

  // ==========================================
  // FILTRAR AMBIENTES Y EQUIPOS
  // ==========================================

  const ambientesFiltrados = ambientes.filter(
    (ambiente) =>
      String(ambiente.id_sede) === form.sede
  );

  const equiposFiltrados = equipos.filter(
    (equipo) =>
      String(equipo.id_ambiente) === form.ambiente
  );

  // ==========================================
  // CAMBIAR CAMPOS
  // ==========================================

  const handleChange = (
    e: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "sede") {
        return {
          ...prev,
          sede: value,
          ambiente: "",
          equipo: "",
          numeroComputador: "",
        };
      }

      if (name === "ambiente") {
        return {
          ...prev,
          ambiente: value,
          equipo: "",
          numeroComputador: "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    setMensaje("");
  };

  // ==========================================
  // EVIDENCIA
  // ==========================================

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setForm((prev) => ({
        ...prev,
        evidencia: null,
      }));
      return;
    }

    if (
      !["image/jpeg", "image/png"].includes(file.type)
    ) {
      setMensaje(
        "Solo se permiten imágenes JPG o PNG."
      );
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensaje(
        "La imagen no puede superar los 5 MB."
      );
      e.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      evidencia: file,
    }));

    setMensaje("");
  };

  // ==========================================
  // ENVIAR REPORTE
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (enviando || reporteGuardado) return;

    if (
      !form.sede ||
      !form.ambiente ||
      !form.tipoProblema ||
      !form.estado ||
      !form.prioridad ||
      !form.descripcion.trim()
    ) {
      setMensaje(
        "Completa todos los campos obligatorios."
      );
      return;
    }

    if (form.descripcion.trim().length < 3) {
      setMensaje(
        "La descripción debe tener al menos 3 caracteres."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate(
        reportarOtroEquipo
          ? "/login-aprendiz?otro=1"
          : "/login-aprendiz"
      );
      return;
    }

    const prioridad =
      form.prioridad === "Crítica"
        ? "alta"
        : form.prioridad.toLowerCase();

    const descripcionCompleta = [
      `Tipo de problema: ${form.tipoProblema}`,
      `Estado informado: ${form.estado}`,
      `Descripción: ${form.descripcion.trim()}`,
    ].join("\n");

    let ruta = `${API_URL}/api/reportes`;

    let datosReporte:
      | {
          id_equipo: number;
          descripcion: string;
          prioridad: string;
        }
      | {
          id_sede: number;
          id_ambiente: number;
          numero_etiqueta: number;
          descripcion: string;
          prioridad: string;
        };

    if (reportarOtroEquipo) {
      // REPORTE DESDE OTRO EQUIPO.
      const numero = Number(form.numeroComputador);

      if (
        !form.numeroComputador ||
        !Number.isInteger(numero) ||
        numero < 1 ||
        numero > 30
      ) {
        setMensaje(
          "Selecciona un computador del 1 al 30."
        );
        return;
      }

      ruta = `${API_URL}/api/reportes/otro-equipo`;

      datosReporte = {
        id_sede: Number(form.sede),
        id_ambiente: Number(form.ambiente),
        numero_etiqueta: numero,
        descripcion: descripcionCompleta,
        prioridad,
      };
    } else {
      // REPORTE NORMAL.
      const equipoSeleccionado =
        equiposFiltrados.find(
          (equipo) =>
            String(equipo.id_equipo) === form.equipo
        );

      if (!equipoSeleccionado) {
        setMensaje(
          "Selecciona un equipo válido."
        );
        return;
      }

      datosReporte = {
        id_equipo: equipoSeleccionado.id_equipo,
        descripcion: descripcionCompleta,
        prioridad,
      };
    }

    try {
      setEnviando(true);
      setMensaje("");

      const respuesta = await fetch(ruta, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosReporte),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        if (
          respuesta.status === 401 ||
          respuesta.status === 403
        ) {
          throw new Error(
            typeof resultado.detail === "string"
              ? resultado.detail
              : "Tu sesión no permite crear reportes."
          );
        }

        throw new Error(
          typeof resultado.detail === "string"
            ? resultado.detail
            : typeof resultado.mensaje === "string"
            ? resultado.mensaje
            : "No fue posible guardar el reporte."
        );
      }

      setReporteGuardado(true);

      // Regresar al dashboard con confirmación.
      navigate("/dashboard-aprendiz", {
        replace: true,
        state: {
          mensaje:
            "¡Listo! Equipo reportado correctamente.",
        },
      });
    } catch (error) {
      console.error(
        "Error enviando reporte:",
        error
      );

      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar el reporte."
      );
    } finally {
      setEnviando(false);
    }
  };

  // ==========================================
  // CANCELAR
  // ==========================================

  const handleCancel = () => {
    navigate("/dashboard-aprendiz");
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="reporte-page">
      <header className="topbar">
        <div className="topbar-brand">
          <h1>
            Data<span>Ventor</span>
          </h1>
          <p>Gestión de equipos en ambientes SENA</p>
        </div>

        <nav
          className="topbar-actions"
          aria-label="Navegación principal"
        >
          <button
            type="button"
            className="btn-inicio"
            onClick={() => navigate("/")}
          >
            Inicio
          </button>

          <button
            type="button"
            className="btn-cerrar-sesion"
            onClick={handleCancel}
          >
            Volver
          </button>
        </nav>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          <section className="form-card">

            {/* ENCABEZADO DEL FORMULARIO */}
            <div className="form-header">
              <div
                className="report-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="5"
                    y="3"
                    width="14"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M8 8H16M8 12H16M8 16H13"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <h2>
                  {reportarOtroEquipo
                    ? "Reportar desde otro equipo"
                    : "Crear reporte"}
                </h2>

                <p>
                  {reportarOtroEquipo
                    ? "Selecciona la sede, el ambiente y el número del computador."
                    : "Registra un problema o fallo en un equipo del ambiente."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">

                {/* SEDE */}
                <div className="form-group">
                  <label htmlFor="sede">
                    Sede <span>*</span>
                  </label>

                  <select
                    id="sede"
                    name="sede"
                    value={form.sede}
                    onChange={handleChange}
                    required
                    disabled={
                      cargando || reporteGuardado
                    }
                  >
                    <option value="">
                      Selecciona la sede
                    </option>

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

                {/* AMBIENTE */}
                <div className="form-group">
                  <label htmlFor="ambiente">
                    Ambiente <span>*</span>
                  </label>

                  <select
                    id="ambiente"
                    name="ambiente"
                    value={form.ambiente}
                    onChange={handleChange}
                    required
                    disabled={
                      !form.sede ||
                      cargando ||
                      reporteGuardado
                    }
                  >
                    <option value="">
                      Selecciona el ambiente
                    </option>

                    {ambientesFiltrados.map(
                      (ambiente) => (
                        <option
                          key={ambiente.id_ambiente}
                          value={ambiente.id_ambiente}
                        >
                          {ambiente.descripcion}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* EQUIPO O ETIQUETA */}
                {reportarOtroEquipo ? (
                  <div className="form-group">
                    <label htmlFor="numeroComputador">
                      Número de computador <span>*</span>
                    </label>

                    <select
                      id="numeroComputador"
                      name="numeroComputador"
                      value={form.numeroComputador}
                      onChange={handleChange}
                      required
                      disabled={
                        !form.ambiente ||
                        cargando ||
                        reporteGuardado
                      }
                    >
                      <option value="">
                        Selecciona el computador
                      </option>

                      {Array.from(
                        { length: 30 },
                        (_, i) => i + 1
                      ).map((numero) => (
                        <option
                          key={numero}
                          value={numero}
                        >
                          Computador {numero}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="equipo">
                      Equipo <span>*</span>
                    </label>

                    <select
                      id="equipo"
                      name="equipo"
                      value={form.equipo}
                      onChange={handleChange}
                      required
                      disabled={
                        !form.ambiente ||
                        cargando ||
                        reporteGuardado
                      }
                    >
                      <option value="">
                        Selecciona el equipo
                      </option>

                      {equiposFiltrados.map(
                        (equipo) => (
                          <option
                            key={equipo.id_equipo}
                            value={equipo.id_equipo}
                          >
                            {equipo.tipo} -{" "}
                            {equipo.modelo} -{" "}
                            {equipo.serial ||
                              `Etiqueta ${equipo.numero_etiqueta ?? "sin asignar"}`}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                {/* TIPO DE PROBLEMA */}
                <div className="form-group">
                  <label htmlFor="tipoProblema">
                    Tipo de problema <span>*</span>
                  </label>

                  <select
                    id="tipoProblema"
                    name="tipoProblema"
                    value={form.tipoProblema}
                    onChange={handleChange}
                    required
                    disabled={reporteGuardado}
                  >
                    <option value="">
                      Selecciona el tipo de problema
                    </option>
                    <option value="Hardware">
                      Hardware
                    </option>
                    <option value="Software">
                      Software
                    </option>
                    <option value="Conectividad">
                      Conectividad
                    </option>
                    <option value="Periférico">
                      Periférico
                    </option>
                    <option value="Otro">
                      Otro
                    </option>
                  </select>
                </div>

                {/* ESTADO */}
                <div className="form-group">
                  <label htmlFor="estado">
                    Estado actual del equipo <span>*</span>
                  </label>

                  <select
                    id="estado"
                    name="estado"
                    className="estado-select"
                    value={form.estado}
                    onChange={handleChange}
                    required
                    disabled={reporteGuardado}
                  >
                    <option value="En mal estado">
                      En mal estado
                    </option>
                    <option value="Fuera de servicio">
                      Fuera de servicio
                    </option>
                    <option value="Presenta fallas">
                      Presenta fallas
                    </option>
                  </select>
                </div>

                {/* PRIORIDAD */}
                <div className="form-group">
                  <label htmlFor="prioridad">
                    Prioridad <span>*</span>
                  </label>

                  <select
                    id="prioridad"
                    name="prioridad"
                    className="prioridad-select"
                    value={form.prioridad}
                    onChange={handleChange}
                    required
                    disabled={reporteGuardado}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="description-group">
                <label htmlFor="descripcion">
                  <span
                    className="label-icon"
                    aria-hidden="true"
                  >
                    ▤
                  </span>
                  Descripción del problema <span>*</span>
                </label>

                <div className="textarea-wrap">
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    maxLength={300}
                    required
                    disabled={reporteGuardado}
                    placeholder="Describe en detalle el problema que presenta el equipo..."
                  />

                  <div className="counter">
                    {form.descripcion.length}/300
                  </div>
                </div>
              </div>

              {/* EVIDENCIA */}
              <div className="evidence-group">
                <label htmlFor="evidencia">
                  <span
                    className="paperclip"
                    aria-hidden="true"
                  >
                    ⌕
                  </span>
                  Evidencia <small>(opcional)</small>
                </label>

                <label
                  className="upload-box"
                  htmlFor="evidencia"
                >
                  <input
                    id="evidencia"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFileChange}
                    disabled={reporteGuardado}
                  />

                  <span
                    className="upload-icon"
                    aria-hidden="true"
                  >
                    ↑
                  </span>

                  <span className="upload-text">
                    {form.evidencia ? (
                      <>
                        <strong>
                          {form.evidencia.name}
                        </strong>
                        <p>
                          Imagen seleccionada correctamente
                        </p>
                      </>
                    ) : (
                      <>
                        <strong>
                          Arrastra una imagen aquí o haz
                          clic para seleccionar
                        </strong>
                        <p>
                          Formatos: JPG, PNG (Máx. 5 MB)
                        </p>
                      </>
                    )}
                  </span>
                </label>

                {form.evidencia &&
                  !reporteGuardado && (
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          evidencia: null,
                        }));

                        const input =
                          document.getElementById(
                            "evidencia"
                          ) as HTMLInputElement | null;

                        if (input) {
                          input.value = "";
                        }
                      }}
                    >
                      Quitar imagen
                    </button>
                  )}
              </div>

              {/* MENSAJES */}
              {mensaje && (
                <p
                  className="form-message"
                  role="status"
                >
                  {mensaje}
                </p>
              )}

              {/* BOTONES */}
              <div className="buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={
                    cargando ||
                    enviando ||
                    reporteGuardado
                  }
                >
                  {enviando
                    ? "Enviando..."
                    : reporteGuardado
                    ? "Reporte enviado"
                    : "➤  Enviar reporte"}
                </button>
              </div>
            </form>
          </section>

          {/* PANEL DERECHO */}
          <aside className="info-panel">
            <section className="info-card tips">
              <h3>💡 &nbsp; Ten en cuenta</h3>
              <ul>
                <li>
                  Describe el problema con claridad.
                </li>
                <li>
                  Selecciona correctamente el ambiente y equipo.
                </li>
                <li>
                  Adjunta una imagen si es posible.
                </li>
                <li>
                  Tu reporte será revisado por el técnico.
                </li>
              </ul>
            </section>

            <section className="info-card process">
              <h3>⚙️ &nbsp; ¿Qué pasa después?</h3>

              <div className="step">
                <b>1</b>
                <p>Tu reporte se registra en el sistema.</p>
              </div>

              <div className="step">
                <b>2</b>
                <p>El técnico revisa la información.</p>
              </div>

              <div className="step">
                <b>3</b>
                <p>Se realiza el seguimiento del estado.</p>
              </div>

              <div className="step">
                <b>4</b>
                <p>
                  Recibirás una notificación con el avance.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
