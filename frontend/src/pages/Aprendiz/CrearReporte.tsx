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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      evidencia: file,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Datos del reporte:", form);

    alert("Reporte creado correctamente");
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <div className="reporte-page">

      {/* =========================
          SIDEBAR
      ========================= */}
      <aside className="sidebar">

        <div className="logo-container">
          <div className="logo-icon">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="logo-text">
            <h1>
              Data<span>Ventor</span>
            </h1>

            <p>Gestión de equipos y ambientes SENA</p>
          </div>
        </div>


        {/* MENÚ */}
        <nav className="menu">

          <a href="/inicio">
            <span className="menu-icon">⌂</span>
            <span>Inicio</span>
          </a>

          <a href="#">
            <span className="menu-icon">▣</span>
            <span>Ver equipos</span>
          </a>

          <a
            className="active"
            href="/crear-reporte"
          >
            <span className="menu-icon">▤</span>
            <span>Crear reporte</span>
          </a>

          <a href="/mis-reportes">
            <span className="menu-icon">▤</span>
            <span>Mis reportes</span>
          </a>

          <a href="#">
            <span className="menu-icon">▣</span>
            <span>Ambientes</span>
          </a>

          <a href="#">
            <span className="menu-icon">?</span>
            <span>Ayuda</span>
          </a>

        </nav>


        {/* FOOTER SIDEBAR */}
        <div className="sidebar-footer">

          <div className="mini-logo">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div>
            <strong>
              Data<span>Ventor</span>
            </strong>

            <small>
              Ambientes que funcionan
            </small>
          </div>

        </div>

      </aside>


      {/* =========================
          CONTENIDO PRINCIPAL
      ========================= */}
      <main className="main-content">

        {/* HEADER */}
        <header className="topbar">

          <div className="topbar-space"></div>

          <div className="user-section">

            <div className="notification">
              ♧
              <span></span>
            </div>

            <div className="avatar">
              👤
            </div>

            <strong>
              Aprendiz
            </strong>

            <span className="arrow">
             ⌄
            </span>

          </div>

        </header>


        {/* CONTENIDO */}
        <div className="content-wrapper">


          {/* =========================
              FORMULARIO
          ========================= */}
          <section className="form-card">


            {/* TÍTULO */}
            <div className="form-header">

              <div className="report-icon">
                ▤
              </div>

              <div>
                <h2>
                  Crear reporte
                </h2>

                <p>
                  Registra un problema o fallo en un equipo del ambiente.
                </p>
              </div>

            </div>


            <form onSubmit={handleSubmit}>


              {/* =========================
                  CAMPOS PRINCIPALES
              ========================= */}
              <div className="form-grid">


                {/* SEDE */}
                <div className="form-group">

                  <label>
                    Sede <span>*</span>
                  </label>

                  <select
                    name="sede"
                    value={form.sede}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Selecciona la sede
                    </option>

                    <option value="Centro de Diseño">
                      Centro de Diseño
                    </option>

                    <option value="Centro de Electricidad">
                      Centro de Electricidad
                    </option>

                    <option value="Centro de Gestión">
                      Centro de Gestión
                    </option>

                  </select>

                </div>


                {/* AMBIENTE */}
                <div className="form-group">

                  <label>
                    Ambiente <span>*</span>
                  </label>

                  <select
                    name="ambiente"
                    value={form.ambiente}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Selecciona el ambiente
                    </option>

                    <option value="Ambiente 101">
                      Ambiente 101
                    </option>

                    <option value="Ambiente 102">
                      Ambiente 102
                    </option>

                    <option value="Ambiente 103">
                      Ambiente 103
                    </option>

                  </select>

                </div>


                {/* EQUIPO */}
                <div className="form-group">

                  <label>
                    Equipo <span>*</span>
                  </label>

                  <select
                    name="equipo"
                    value={form.equipo}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Selecciona el equipo
                    </option>

                    <option value="Computador 01">
                      Computador 01
                    </option>

                    <option value="Computador 02">
                      Computador 02
                    </option>

                    <option value="Computador 03">
                      Computador 03
                    </option>

                  </select>

                </div>


                {/* TIPO DE PROBLEMA */}
                <div className="form-group">

                  <label>
                    Tipo de problema <span>*</span>
                  </label>

                  <select
                    name="tipoProblema"
                    value={form.tipoProblema}
                    onChange={handleChange}
                    required
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

                  <label>
                    Estado actual del equipo <span>*</span>
                  </label>

                  <select
                    className="estado-select"
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    required
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

                  <label>
                    Prioridad <span>*</span>
                  </label>

                  <select
                    className="prioridad-select"
                    name="prioridad"
                    value={form.prioridad}
                    onChange={handleChange}
                    required
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

                    <option value="Crítica">
                      Crítica
                    </option>

                  </select>

                </div>

              </div>


              {/* =========================
                  DESCRIPCIÓN
              ========================= */}
              <div className="description-group">

                <label>

                  <span className="label-icon">
                    ▤
                  </span>

                  Descripción del problema

                  <span>
                    *
                  </span>

                </label>

                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  maxLength={300}
                  required
                  placeholder="Describe en detalle el problema que presenta el equipo..."
                />

                <div className="counter">
                  {form.descripcion.length}/300
                </div>

              </div>


              {/* =========================
                  EVIDENCIA
              ========================= */}
              <div className="evidence-group">

                <label>

                  <span className="paperclip">
                    ⌕
                  </span>

                  Evidencia

                  <small>
                    (opcional)
                  </small>

                </label>


                <label className="upload-box">

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />


                  <div className="upload-icon">
                    ↑
                  </div>


                  <div className="upload-text">

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
                          Arrastra una imagen aquí o haz clic para seleccionar
                        </strong>

                        <p>
                          Formatos: JPG, PNG (Máx. 5MB)
                        </p>
                      </>

                    )}

                  </div>

                </label>

              </div>


              {/* =========================
                  BOTONES
              ========================= */}
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
                >
                  ➤ &nbsp; Enviar reporte
                </button>

              </div>

            </form>

          </section>


          {/* =========================
              PANEL DERECHO
          ========================= */}
          <aside className="info-panel">


            {/* TEN EN CUENTA */}
            <div className="info-card tips">

              <h3>
                💡 &nbsp; Ten en cuenta
              </h3>

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

            </div>


            {/* PROCESO */}
            <div className="info-card process">

              <h3>
                ⚙️ &nbsp; ¿Qué pasa después?
              </h3>


              <div className="step">

                <b>
                  1
                </b>

                <p>
                  Tu reporte se registra en el sistema.
                </p>

              </div>


              <div className="step">

                <b>
                  2
                </b>

                <p>
                  El técnico revisa la información.
                </p>

              </div>


              <div className="step">

                <b>
                  3
                </b>

                <p>
                  Se realiza el seguimiento del estado.
                </p>

              </div>


              <div className="step">

                <b>
                  4
                </b>

                <p>
                  Recibirás una notificación con el avance.
                </p>

              </div>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}