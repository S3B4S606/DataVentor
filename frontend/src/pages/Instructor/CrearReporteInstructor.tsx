
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFileAlt } from "react-icons/fa";

import "../../styles/Instructor/CrearReporteInstructor.css";

const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

type Sede = {
  id_sede: number;
  descripcion: string;
};

type Ambiente = {
  id_ambiente: number;
  id_sede: number;
  descripcion: string;
};

type Equipo = {
  id_equipo: number;
  id_ambiente: number;
  registro_unico: string;
  tipo: string;
  modelo: string;
  numero_etiqueta?: number | null;
};

type Formulario = {
  sede: string;
  ambiente: string;
  equipo: string;
  tipoProblema: string;
  prioridad: string;
  descripcion: string;
};

const formularioInicial: Formulario = {
  sede: "",
  ambiente: "",
  equipo: "",
  tipoProblema: "",
  prioridad: "Media",
  descripcion: "",
};

export default function CrearReporteInstructor() {
  const navigate = useNavigate();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const [form, setForm] = useState<Formulario>({
    ...formularioInicial,
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // ==========================================
  // CARGAR SEDES, AMBIENTES Y EQUIPOS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const cargarDatos = async () => {
      setCargando(true);
      setError("");

      try {
        const [resSedes, resAmbientes, resEquipos] =
          await Promise.all([
            fetch(`${API}/api/sedes`, {
              signal: controller.signal,
            }),
            fetch(`${API}/api/ambientes`, {
              signal: controller.signal,
            }),
            fetch(`${API}/api/equipos`, {
              signal: controller.signal,
            }),
          ]);

        if (
          !resSedes.ok ||
          !resAmbientes.ok ||
          !resEquipos.ok
        ) {
          throw new Error(
            "No se pudieron consultar los datos."
          );
        }

        const datosSedes: Sede[] =
          await resSedes.json();

        const datosAmbientes: Ambiente[] =
          await resAmbientes.json();

        const datosEquipos: Equipo[] =
          await resEquipos.json();

        if (controller.signal.aborted) return;

        setSedes(datosSedes);
        setAmbientes(datosAmbientes);
        setEquipos(datosEquipos);

      } catch (err) {
        if (controller.signal.aborted) return;

        console.error(
          "Error al cargar catálogos:",
          err
        );

        setError(
          "No fue posible cargar las sedes, ambientes y equipos."
        );

      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => controller.abort();
  }, []);

  // ==========================================
  // FILTRAR AMBIENTES SEGÚN SEDE
  // ==========================================

  const ambientesFiltrados = ambientes.filter(
    (ambiente) =>
      ambiente.id_sede === Number(form.sede)
  );

  // ==========================================
  // FILTRAR EQUIPOS SEGÚN AMBIENTE
  // ==========================================

  const equiposFiltrados = equipos.filter(
    (equipo) =>
      equipo.id_ambiente === Number(form.ambiente)
  );

  // ==========================================
  // CAMBIAR CAMPOS DEL FORMULARIO
  // ==========================================

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,

      ...(name === "sede"
        ? {
            ambiente: "",
            equipo: "",
          }
        : {}),

      ...(name === "ambiente"
        ? {
            equipo: "",
          }
        : {}),
    }));

    setMensaje("");
    setError("");
  };

  // ==========================================
  // ENVIAR REPORTE
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (enviando || cargando) return;

    setMensaje("");
    setError("");

    // Validar campos obligatorios

    if (
      !form.sede ||
      !form.ambiente ||
      !form.equipo ||
      !form.tipoProblema ||
      !form.descripcion.trim()
    ) {
      setError(
        "Completa todos los campos obligatorios."
      );
      return;
    }

    // Comprobar que el equipo pertenezca
    // al ambiente seleccionado

    const equipoSeleccionado =
      equiposFiltrados.find(
        (equipo) =>
          equipo.id_equipo === Number(form.equipo)
      );

    if (!equipoSeleccionado) {
      setError(
        "Selecciona un equipo válido para el ambiente."
      );
      return;
    }

    // Consultar sesión del instructor

    const usuarioGuardado =
      localStorage.getItem("usuario");

    const token =
      localStorage.getItem("token");

    if (!usuarioGuardado || !token) {
      setError(
        "Debes iniciar sesión como Instructor para crear un reporte."
      );
      return;
    }

    try {
      const usuario = JSON.parse(usuarioGuardado);

      if (usuario.rol !== "instructor") {
        setError(
          "El usuario no tiene permisos de Instructor."
        );
        return;
      }

      const idUsuario =
        Number(usuario.id_usuario);

      if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0
      ) {
        setError(
          "No se pudo identificar al Instructor."
        );
        return;
      }

    } catch {
      setError(
        "Los datos de la sesión no son válidos."
      );
      return;
    }

    // Enviar el reporte a FastAPI

    setEnviando(true);

    try {
      const respuesta = await fetch(
        `${API}/api/reportes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_equipo: Number(form.equipo),
            descripcion:
              `[${form.tipoProblema}] ` +
              form.descripcion.trim(),
            prioridad:
              form.prioridad.toLowerCase(),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          typeof datos.detail === "string"
            ? datos.detail
            : typeof datos.mensaje === "string"
            ? datos.mensaje
            : "No fue posible guardar el reporte."
        );
      }

      setMensaje(
        `Reporte creado correctamente. Número de reporte: ${datos.id_reporte}`
      );

      // Limpiar formulario

      setForm({
        ...formularioInicial,
      });

    } catch (err) {
      console.error(
        "Error al registrar reporte:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar el reporte."
      );

    } finally {
      setEnviando(false);
    }
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="crear-reporte-instructor">

      {/* ENCABEZADO */}

      <header className="cri-header">

        <div className="cri-brand">
          <h1>
            Data<span>Ventor</span>
          </h1>

          <p>
            Gestión de equipos en ambientes SENA
          </p>
        </div>

        <button
          type="button"
          className="cri-back"
          onClick={() =>
            navigate("/dashboard-instructor")
          }
        >
          <FaArrowLeft aria-hidden="true" />
          <span>Volver al tablero</span>
        </button>

      </header>

      {/* CONTENIDO PRINCIPAL */}

      <main className="cri-main">

        <section className="cri-card">

          {/* TÍTULO */}

          <div className="cri-title">

            <div
              className="cri-icon"
              aria-hidden="true"
            >
              <FaFileAlt />
            </div>

            <div className="cri-title-text">
              <h2>Crear reporte</h2>

              <p>
                Registra una falla en un equipo
                del ambiente.
              </p>
            </div>

          </div>

          {/* FORMULARIO */}

          <form onSubmit={handleSubmit}>

            <div className="cri-grid">

              {/* SEDE */}

              <div className="cri-group">

                <label htmlFor="cri-sede">
                  Sede *
                </label>

                <select
                  id="cri-sede"
                  name="sede"
                  value={form.sede}
                  onChange={handleChange}
                  required
                  disabled={cargando || enviando}
                >
                  <option value="">
                    {cargando
                      ? "Cargando sedes..."
                      : "Selecciona la sede"}
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

              <div className="cri-group">

                <label htmlFor="cri-ambiente">
                  Ambiente *
                </label>

                <select
                  id="cri-ambiente"
                  name="ambiente"
                  value={form.ambiente}
                  onChange={handleChange}
                  required
                  disabled={
                    !form.sede ||
                    cargando ||
                    enviando
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

              {/* EQUIPO */}

              <div className="cri-group">

                <label htmlFor="cri-equipo">
                  Equipo *
                </label>

                <select
                  id="cri-equipo"
                  name="equipo"
                  value={form.equipo}
                  onChange={handleChange}
                  required
                  disabled={
                    !form.ambiente ||
                    cargando ||
                    enviando
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
                        {equipo.registro_unico ||
                          (equipo.numero_etiqueta
                            ? `Equipo ${equipo.numero_etiqueta}`
                            : `ID ${equipo.id_equipo}`)}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* TIPO DE PROBLEMA */}

              <div className="cri-group">

                <label htmlFor="cri-tipoProblema">
                  Tipo de problema *
                </label>

                <select
                  id="cri-tipoProblema"
                  name="tipoProblema"
                  value={form.tipoProblema}
                  onChange={handleChange}
                  required
                  disabled={enviando}
                >
                  <option value="">
                    Selecciona el problema
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

              {/* PRIORIDAD */}

              <div className="cri-group">

                <label htmlFor="cri-prioridad">
                  Prioridad *
                </label>

                <select
                  id="cri-prioridad"
                  name="prioridad"
                  value={form.prioridad}
                  onChange={handleChange}
                  required
                  disabled={enviando}
                >
                  <option value="Baja">
                    Baja
                  </option>

                  <option value="Media">
                    Media
                  </option>

                  <option value="Alta">
                    Alta
                  </option>
                </select>

              </div>

            </div>

            {/* DESCRIPCIÓN */}

            <div className="cri-group cri-description">

              <label htmlFor="cri-descripcion">
                Descripción del problema *
              </label>

              <textarea
                id="cri-descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Describe la falla que presenta el equipo..."
                maxLength={300}
                required
                disabled={enviando}
              />

              <small>
                {form.descripcion.length}/300 caracteres
              </small>

            </div>

            {/* MENSAJE DE ÉXITO */}

            {mensaje && (
              <div
                className="cri-message cri-success"
                role="status"
              >
                {mensaje}
              </div>
            )}

            {/* MENSAJE DE ERROR */}

            {error && (
              <div
                className="cri-message cri-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* BOTONES */}

            <div className="cri-buttons">

              <button
                type="button"
                className="cri-cancel"
                onClick={() =>
                  navigate("/dashboard-instructor")
                }
                disabled={enviando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="cri-submit"
                disabled={enviando || cargando}
              >
                {enviando
                  ? "Enviando..."
                  : "Enviar reporte"}
              </button>

            </div>

          </form>

        </section>

      </main>

    </div>
  );
}
