
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFileAlt } from "react-icons/fa";

import "../../styles/Instructor/CrearReporteInstructor.css";

export default function CrearReporteInstructor() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sede: "",
    ambiente: "",
    equipo: "",
    tipoProblema: "",
    prioridad: "Media",
    descripcion: "",
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setMensaje("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Por ahora se valida el formulario.
    // La conexión para guardar en PostgreSQL
    // se agregará cuando revisemos el backend.
    console.log("Reporte del instructor:", form);

    setMensaje(
      "Formulario validado. El reporte aún no se ha guardado en la base de datos."
    );
  };

  return (
    <div className="crear-reporte-instructor">
      <header className="cri-header">
        <div>
          <h1>DataVentor</h1>
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
              <p>
                Registra una falla en un equipo del ambiente.
              </p>
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
                >
                  <option value="">Selecciona la sede</option>
                  <option value="Unigermania">Unigermania</option>
                  <option value="Calle 52">Calle 52</option>
                  <option value="Marly">Marly</option>
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
                >
                  <option value="">Selecciona el ambiente</option>
                  <option value="Ambiente 101">Ambiente 101</option>
                  <option value="Ambiente 102">Ambiente 102</option>
                  <option value="Ambiente 103">Ambiente 103</option>
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
                >
                  <option value="">Selecciona el equipo</option>
                  <option value="Computador 01">Computador 01</option>
                  <option value="Computador 02">Computador 02</option>
                  <option value="Computador 03">Computador 03</option>
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
                  <option value="Crítica">Crítica</option>
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

            <div className="cri-buttons">
              <button
                type="button"
                className="cri-cancel"
                onClick={() => navigate("/dashboard-instructor")}
              >
                Cancelar
              </button>

              <button type="submit" className="cri-submit">
                Enviar reporte
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
