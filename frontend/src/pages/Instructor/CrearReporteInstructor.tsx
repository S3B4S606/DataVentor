
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFileAlt } from "react-icons/fa";

import "../../styles/Instructor/CrearReporteInstructor.css";

const API = "http://127.0.0.1:5000";

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
};

export default function CrearReporteInstructor() {
  const navigate = useNavigate();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const [form, setForm] = useState({
    sede: "",
    ambiente: "",
    equipo: "",
    tipoProblema: "",
    prioridad: "Media",
    descripcion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resSedes, resAmbientes, resEquipos] =
          await Promise.all([
            fetch(`${API}/api/sedes`),
            fetch(`${API}/api/ambientes`),
            fetch(`${API}/api/equipos`),
          ]);

        if (
          !resSedes.ok ||
          !resAmbientes.ok ||
          !resEquipos.ok
        ) {
          throw new Error("No se pudieron consultar los datos.");
        }

        setSedes(await resSedes.json());
        setAmbientes(await resAmbientes.json());
        setEquipos(await resEquipos.json());
      } catch (err) {
        console.error("Error al cargar catálogos:", err);
        setError(
          "No fue posible cargar las sedes, ambientes y equipos."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const ambientesFiltrados = ambientes.filter(
    (a) => a.id_sede === Number(form.sede)
  );

  const equiposFiltrados = equipos.filter(
    (e) => e.id_ambiente === Number(form.ambiente)
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "sede"
        ? { ambiente: "", equipo: "" }
        : {}),
      ...(name === "ambiente" ? { equipo: "" } : {}),
    }));

    setMensaje("");
    setError("");
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (
      !form.sede ||
      !form.ambiente ||
      !form.equipo ||
      !form.tipoProblema ||
      !form.descripcion.trim()
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    const usuarioGuardado = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");

    if (!usuarioGuardado || !token) {
      setError(
        "Debes iniciar sesión como Instructor para crear un reporte."
      );
      return;
    }

    let idUsuario: number;

    try {
      const usuario = JSON.parse(usuarioGuardado);

      if (usuario.rol !== "instructor") {
        setError("El usuario no tiene permisos de Instructor.");
        return;
      }

      idUsuario = Number(usuario.id_usuario);

      if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        setError("No se pudo identificar al Instructor.");
        return;
      }
    } catch {
      setError("Los datos de la sesión no son válidos.");
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch(`${API}/api/reportes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_equipo: Number(form.equipo),
          id_usuario: idUsuario,
          descripcion: `[${form.tipoProblema}] ${form.descripcion.trim()}`,
          prioridad: form.prioridad.toLowerCase(),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
            "No fue posible guardar el reporte."
        );
      }

      setMensaje(
        `Reporte creado correctamente. Número de reporte: ${datos.id_reporte}`
      );

      setForm({
        sede: "",
        ambiente: "",
        equipo: "",
        tipoProblema: "",
        prioridad: "Media",
        descripcion: "",
      });
    } catch (err) {
      console.error("Error al registrar reporte:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar el reporte."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="crear-reporte-instructor">
      <header className="cri-header">
        <div>
          <h1>
          Data<span>Ventor</span>
          </h1>
          <p>Gestión de equipos en ambientes SENA</p>
        </div>

        <button
          type="button"
          className="cri-back"
          onClick={() => navigate("/dashboard-instructor")}
        >
          <FaArrowLeft />
          Volver al tablero
        </button>
      </header>

      <main className="cri-main">
        <section className="cri-card">
          <div className="cri-title">
            <div className="cri-icon">
              <FaFileAlt />
            </div>

            <div>
              <h2>Crear reporte</h2>
              <p>Registra una falla en un equipo del ambiente.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="cri-grid">
              <div className="cri-group">
                <label htmlFor="cri-sede">Sede *</label>

                <select
                  id="cri-sede"
                  name="sede"
                  value={form.sede}
                  onChange={handleChange}
                  required
                  disabled={cargando}
                >
                  <option value="">Selecciona la sede</option>
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

              <div className="cri-group">
                <label htmlFor="cri-ambiente">Ambiente *</label>

                <select
                  id="cri-ambiente"
                  name="ambiente"
                  value={form.ambiente}
                  onChange={handleChange}
                  required
                  disabled={!form.sede}
                >
                  <option value="">Selecciona el ambiente</option>
                  {ambientesFiltrados.map((ambiente) => (
                    <option
                      key={ambiente.id_ambiente}
                      value={ambiente.id_ambiente}
                    >
                      {ambiente.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cri-group">
                <label htmlFor="cri-equipo">Equipo *</label>

                <select
                  id="cri-equipo"
                  name="equipo"
                  value={form.equipo}
                  onChange={handleChange}
                  required
                  disabled={!form.ambiente}
                >
                  <option value="">Selecciona el equipo</option>
                  {equiposFiltrados.map((equipo) => (
                    <option
                      key={equipo.id_equipo}
                      value={equipo.id_equipo}
                    >
                      {equipo.tipo} - {equipo.registro_unico}
                    </option>
                  ))}
                </select>
              </div>

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
                >
                  <option value="">Selecciona el problema</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Conectividad">Conectividad</option>
                  <option value="Periférico">Periférico</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="cri-group">
                <label htmlFor="cri-prioridad">Prioridad *</label>

                <select
                  id="cri-prioridad"
                  name="prioridad"
                  value={form.prioridad}
                  onChange={handleChange}
                  required
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>

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
              />

              <small>{form.descripcion.length}/300 caracteres</small>
            </div>

            {mensaje && (
              <div className="cri-message" role="status">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="cri-message" role="alert">
                {error}
              </div>
            )}

            <div className="cri-buttons">
              <button
                type="button"
                className="cri-cancel"
                onClick={() => navigate("/dashboard-instructor")}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="cri-submit"
                disabled={enviando || cargando}
              >
                {enviando ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
