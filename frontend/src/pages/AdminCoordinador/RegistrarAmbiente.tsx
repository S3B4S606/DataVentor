
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBuilding,
  FaSave,
  FaMapMarkerAlt,
  FaAlignLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../../styles/AdminCoordinador/RegistrarAmbiente.css";

const API = "http://127.0.0.1:5000";

interface Sede {
  id_sede: number;
  descripcion: string;
}

function RegistrarAmbiente() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sede, setSede] = useState("");

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarSedes = async () => {
      try {
        const respuesta = await fetch(`${API}/api/sedes`);

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las sedes.");
        }

        const datos: Sede[] = await respuesta.json();
        setSedes(datos);
      } catch (err) {
        console.error("Error al cargar sedes:", err);
        setError("No fue posible consultar las sedes.");
      } finally {
        setCargando(false);
      }
    };

    cargarSedes();
  }, []);

  const guardarAmbiente = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("Ingresa el nombre del ambiente.");
      return;
    }

    if (!descripcion.trim()) {
      setError("Ingresa una descripción del ambiente.");
      return;
    }

    if (!sede) {
      setError("Selecciona una sede.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(`${API}/api/ambientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          id_sede: Number(sede),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
            "No fue posible registrar el ambiente."
        );
      }

      setMensaje(
        `Ambiente registrado correctamente. ID: ${datos.id_ambiente}`
      );

      setNombre("");
      setDescripcion("");
      setSede("");
    } catch (err) {
      console.error("Error al registrar ambiente:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar el ambiente."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="registrar-ambiente">
      <header className="registrar-header">
        <div className="registrar-logo">
          <strong>
          Data<span>Ventor</span>
          </strong>
          <small>
            Gestión de equipos en ambientes SENA
          </small>
        </div>

        <button
          type="button"
          className="registrar-back"
          onClick={() => navigate("/ambientes")}
        >
          <FaArrowLeft />
          Volver a ambientes
        </button>
      </header>

      <main className="registrar-content">
        <section className="registrar-card">
          <div className="registrar-icon">
            <FaBuilding />
          </div>

          <h1>Registrar ambiente</h1>

          <p className="registrar-subtitle">
            Ingresa la información del nuevo ambiente
            para agregarlo a DataVentor.
          </p>

          <form onSubmit={guardarAmbiente}>
            <div className="registrar-group">
              <label htmlFor="nombre">
                Nombre del ambiente
              </label>

              <div className="registrar-input">
                <FaBuilding />

                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej. Ambiente 302"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="registrar-group">
              <label htmlFor="descripcion">
                Descripción
              </label>

              <div className="registrar-input registrar-textarea">
                <FaAlignLeft />

                <textarea
                  id="descripcion"
                  placeholder="Ej. Sala de sistemas"
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="registrar-group">
              <label htmlFor="sede">
                Sede
              </label>

              <div className="registrar-input">
                <FaMapMarkerAlt />

                <select
                  id="sede"
                  value={sede}
                  onChange={(e) =>
                    setSede(e.target.value)
                  }
                  required
                  disabled={cargando}
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
              </div>
            </div>

            {error && (
              <div
                className="registrar-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {mensaje && (
              <div
                className="registrar-error"
                role="status"
                style={{
                  backgroundColor: "#e6f7ed",
                  color: "#087443",
                }}
              >
                {mensaje}
              </div>
            )}

            <div className="registrar-actions">
              <button
                type="button"
                className="btn-cancelar"
                onClick={() =>
                  navigate("/ambientes")
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-guardar"
                disabled={
                  guardando ||
                  cargando ||
                  sedes.length === 0
                }
              >
                <FaSave />
                {guardando
                  ? "Guardando..."
                  : "Guardar ambiente"}
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="registrar-footer">
        <div>
          <strong>DataVentor</strong>
          <small>
            Conocimiento que transforma
          </small>
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

export default RegistrarAmbiente;
