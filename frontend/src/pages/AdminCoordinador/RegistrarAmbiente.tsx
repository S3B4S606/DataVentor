import { useState } from "react";
import {
  FaArrowLeft,
  FaBuilding,
  FaSave,
  FaMapMarkerAlt,
  FaAlignLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../../styles/AdminCoordinador/RegistrarAmbiente.css";

function RegistrarAmbiente() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sede, setSede] = useState("Centro de Gestión");

  const [error, setError] = useState("");

  const guardarAmbiente = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!nombre.trim()) {
      setError("Ingresa el nombre del ambiente.");
      return;
    }

    if (!descripcion.trim()) {
      setError("Ingresa una descripción del ambiente.");
      return;
    }

    if (!sede.trim()) {
      setError("Selecciona una sede.");
      return;
    }

    /*
      Por ahora mostramos el flujo del formulario.
      Después conectaremos este botón con el backend
      y PostgreSQL.
    */

    console.log("Ambiente a registrar:", {
      nombre,
      descripcion,
      sede,
    });

    navigate("/ambientes");
  };

  return (
    <div className="registrar-ambiente">

      {/* HEADER */}

      <header className="registrar-header">

        <div className="registrar-logo">
          <strong>DataVentor</strong>

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

      {/* CONTENIDO */}

      <main className="registrar-content">

        <section className="registrar-card">

          {/* ICONO */}

          <div className="registrar-icon">
            <FaBuilding />
          </div>

          <h1>
            Registrar ambiente
          </h1>

          <p className="registrar-subtitle">
            Ingresa la información del nuevo ambiente
            para agregarlo a DataVentor.
          </p>

          <form onSubmit={guardarAmbiente}>

            {/* NOMBRE */}

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
                />

              </div>

            </div>

            {/* DESCRIPCIÓN */}

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
                />

              </div>

            </div>

            {/* SEDE */}

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
                >
                  <option value="Centro de Gestión">
                    Centro de Gestión
                  </option>

                </select>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="registrar-error">
                {error}
              </div>
            )}

            {/* BOTONES */}

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
              >
                <FaSave />
                Guardar ambiente
              </button>

            </div>

          </form>

        </section>

      </main>

      {/* FOOTER */}

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