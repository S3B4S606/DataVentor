import { useState } from "react";
import "../../styles/Aprendiz/CrearReporte.css";

interface FormData {
  sede: string;
  ambiente: string;
  equipo: string;
  tipoProblema: string;
  estado: string;
  prioridad: string;
  descripcion: string;
  evidencia: File | null;
}

export default function CrearReporte() {
  const [form, setForm] = useState<FormData>({
    sede: "",
    ambiente: "",
    equipo: "",
    tipoProblema: "",
    estado: "En mal estado",
    prioridad: "Media",
    descripcion: "",
    evidencia: null,
  });
  const [mensaje, setMensaje] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMensaje("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setMensaje("Solo se permiten imágenes JPG o PNG.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMensaje("La imagen no puede superar los 5 MB.");
      e.target.value = "";
      return;
    }
    setForm((prev) => ({ ...prev, evidencia: file }));
    setMensaje("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Datos del reporte:", form);
    setMensaje("Formulario validado. Para guardar el reporte, conecta este formulario con el backend.");
  };

  const handleCancel = () => window.history.back();

  return (
    <div className="reporte-page">
      <header className="topbar">
        <div className="topbar-brand">
          <h1>DataVentor</h1>
          <p>Gestión de equipos en ambientes SENA</p>
        </div>
        <nav className="topbar-actions" aria-label="Navegación principal">
          <button type="button" className="btn-inicio" onClick={() => (window.location.href = "/inicio")}>Inicio</button>
          <button type="button" className="btn-cerrar-sesion" onClick={() => (window.location.href = "/login")}>Cerrar sesión</button>
        </nav>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          <section className="form-card">
            <div className="form-header">
              <div className="report-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 8H16M8 12H16M8 16H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2>Crear reporte</h2>
                <p>Registra un problema o fallo en un equipo del ambiente.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sede">Sede <span>*</span></label>
                  <select id="sede" name="sede" value={form.sede} onChange={handleChange} required>
                    <option value="">Selecciona la sede</option>
                    <option value="Unigermania">Unigermania</option>
                    <option value="Calle 52">Calle 52</option>
                    <option value="Marly">Marly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ambiente">Ambiente <span>*</span></label>
                  <select id="ambiente" name="ambiente" value={form.ambiente} onChange={handleChange} required>
                    <option value="">Selecciona el ambiente</option>
                    <option value="Ambiente 101">Ambiente 101</option>
                    <option value="Ambiente 102">Ambiente 102</option>
                    <option value="Ambiente 103">Ambiente 103</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="equipo">Equipo <span>*</span></label>
                  <select id="equipo" name="equipo" value={form.equipo} onChange={handleChange} required>
                    <option value="">Selecciona el equipo</option>
                    <option value="Computador 01">Computador 01</option>
                    <option value="Computador 02">Computador 02</option>
                    <option value="Computador 03">Computador 03</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="tipoProblema">Tipo de problema <span>*</span></label>
                  <select id="tipoProblema" name="tipoProblema" value={form.tipoProblema} onChange={handleChange} required>
                    <option value="">Selecciona el tipo de problema</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Conectividad">Conectividad</option>
                    <option value="Periférico">Periférico</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="estado">Estado actual del equipo <span>*</span></label>
                  <select id="estado" className="estado-select" name="estado" value={form.estado} onChange={handleChange} required>
                    <option value="En mal estado">En mal estado</option>
                    <option value="Fuera de servicio">Fuera de servicio</option>
                    <option value="Presenta fallas">Presenta fallas</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prioridad">Prioridad <span>*</span></label>
                  <select id="prioridad" className="prioridad-select" name="prioridad" value={form.prioridad} onChange={handleChange} required>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="description-group">
                <label htmlFor="descripcion"><span className="label-icon" aria-hidden="true">▤</span>Descripción del problema <span>*</span></label>
                <div className="textarea-wrap">
                  <textarea id="descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} maxLength={300} required placeholder="Describe en detalle el problema que presenta el equipo..." />
                  <div className="counter">{form.descripcion.length}/300</div>
                </div>
              </div>

              <div className="evidence-group">
                <label htmlFor="evidencia"><span className="paperclip" aria-hidden="true">⌕</span>Evidencia <small>(opcional)</small></label>
                <label className="upload-box" htmlFor="evidencia">
                  <input id="evidencia" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} />
                  <span className="upload-icon" aria-hidden="true">↑</span>
                  <span className="upload-text">
                    {form.evidencia ? <><strong>{form.evidencia.name}</strong><p>Imagen seleccionada correctamente</p></> : <><strong>Arrastra una imagen aquí o haz clic para seleccionar</strong><p>Formatos: JPG, PNG (Máx. 5 MB)</p></>}
                  </span>
                </label>
                {form.evidencia && <button type="button" className="remove-file" onClick={() => { setForm((prev) => ({ ...prev, evidencia: null })); const input = document.getElementById("evidencia") as HTMLInputElement | null; if (input) input.value = ""; }}>Quitar imagen</button>}
              </div>

              {mensaje && <p className="form-message" role="status">{mensaje}</p>}

              <div className="buttons">
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancelar</button>
                <button type="submit" className="submit-button">➤ &nbsp; Enviar reporte</button>
              </div>
            </form>
          </section>

          <aside className="info-panel">
            <section className="info-card tips">
              <h3>💡 &nbsp; Ten en cuenta</h3>
              <ul>
                <li>Describe el problema con claridad.</li>
                <li>Selecciona correctamente el ambiente y equipo.</li>
                <li>Adjunta una imagen si es posible.</li>
                <li>Tu reporte será revisado por el técnico.</li>
              </ul>
            </section>

            <section className="info-card process">
              <h3>⚙️ &nbsp; ¿Qué pasa después?</h3>
              <div className="step"><b>1</b><p>Tu reporte se registra en el sistema.</p></div>
              <div className="step"><b>2</b><p>El técnico revisa la información.</p></div>
              <div className="step"><b>3</b><p>Se realiza el seguimiento del estado.</p></div>
              <div className="step"><b>4</b><p>Recibirás una notificación con el avance.</p></div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
