
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/Aprendiz/SeleccionarAmbienteAprendiz.css";

interface Sede {
  id_sede: number;
  descripcion: string;
}

interface Ambiente {
  id_ambiente: number;
  id_sede: number;
  descripcion: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

export default function SeleccionarAmbienteAprendiz() {
  const navigate = useNavigate();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);

  const [sede, setSede] = useState("");
  const [ambiente, setAmbiente] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // CARGAR SEDES Y AMBIENTES
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const cargarDatos = async () => {
      try {
        const [respuestaSedes, respuestaAmbientes] =
          await Promise.all([
            fetch(`${API_URL}/api/sedes`, {
              signal: controller.signal,
            }),
            fetch(`${API_URL}/api/ambientes`, {
              signal: controller.signal,
            }),
          ]);

        if (!respuestaSedes.ok || !respuestaAmbientes.ok) {
          throw new Error(
            "No fue posible consultar las sedes y ambientes."
          );
        }

        const datosSedes: Sede[] =
          await respuestaSedes.json();

        const datosAmbientes: Ambiente[] =
          await respuestaAmbientes.json();

        setSedes(datosSedes);
        setAmbientes(datosAmbientes);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar los ambientes."
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
  // FILTRAR AMBIENTES POR SEDE
  // ==========================================

  const ambientesFiltrados = ambientes.filter(
    (item) => item.id_sede === Number(sede)
  );

  // ==========================================
  // CONTINUAR AL DASHBOARD
  // ==========================================

  const continuar = () => {
    if (!sede || !ambiente) {
      setError("Selecciona la sede y el ambiente.");
      return;
    }

    const ambienteValido = ambientesFiltrados.some(
      (item) => item.id_ambiente === Number(ambiente)
    );

    if (!ambienteValido) {
      setError("Selecciona un ambiente válido.");
      return;
    }

    sessionStorage.setItem("sedeAprendiz", sede);
    sessionStorage.setItem("ambienteAprendiz", ambiente);

    navigate("/dashboard-aprendiz");
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <main className="seleccionar-ambiente-aprendiz">
      <section className="seleccionar-ambiente-card">

        <h1 className="seleccionar-ambiente-logo">
          Data<span>Ventor</span>
        </h1>

        <div className="seleccionar-ambiente-icono">
          🖥️
        </div>

        <h2>Ubicación del computador</h2>

        <p className="seleccionar-ambiente-subtitulo">
          Selecciona la sede y el ambiente donde
          te encuentras para continuar.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            continuar();
          }}
        >
          <label htmlFor="sedeAprendiz">
            Sede
          </label>

          <select
            id="sedeAprendiz"
            value={sede}
            disabled={cargando}
            onChange={(e) => {
              setSede(e.target.value);
              setAmbiente("");
              setError("");
            }}
            required
          >
            <option value="">
              Selecciona una sede
            </option>

            {sedes.map((item) => (
              <option
                key={item.id_sede}
                value={item.id_sede}
              >
                {item.descripcion}
              </option>
            ))}
          </select>

          <label htmlFor="ambienteAprendiz">
            Ambiente
          </label>

          <select
            id="ambienteAprendiz"
            value={ambiente}
            disabled={!sede || cargando}
            onChange={(e) => {
              setAmbiente(e.target.value);
              setError("");
            }}
            required
          >
            <option value="">
              Selecciona un ambiente
            </option>

            {ambientesFiltrados.map((item) => (
              <option
                key={item.id_ambiente}
                value={item.id_ambiente}
              >
                {item.descripcion}
              </option>
            ))}
          </select>

          {error && (
            <div
              className="seleccionar-ambiente-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="seleccionar-ambiente-continuar"
            disabled={cargando || !sede || !ambiente}
          >
            {cargando
              ? "Cargando ambientes..."
              : "Continuar"}
          </button>
        </form>

        <button
          type="button"
          className="seleccionar-ambiente-volver"
          onClick={() => navigate("/")}
        >
          ← Volver al inicio
        </button>
      </section>
    </main>
  );
}
