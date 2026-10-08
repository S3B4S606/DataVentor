import { useNavigate } from "react-router-dom";
import "../styles/Inicio.css";

const Inicio = () => {
    const navigate = useNavigate();

    return (
        <div className="inicio-container">

            {/* VIDEO DE FONDO */}
            <video
                className="inicio-video"
                autoPlay
                muted
                loop
                playsInline
            >
                <source
                src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                type="video/mp4"
/>
            </video>

            {/* CAPA OSCURA */}
            <div className="inicio-overlay"></div>

            {/* HEADER */}
            <header className="inicio-header">

                <div className="logo">
                    <span className="logo-data">
                        DataVentor
                    </span>

                    <small>
                        Gestión de equipos en ambientes SENA
                    </small>
                </div>

                <nav className="inicio-nav">
                    <span className="nav-active">
                        Inicio
                    </span>

                    <span>
                        Servicios
                    </span>

                    <span>
                        Presencial
                    </span>

                    <span>
                        Canales
                    </span>
                </nav>

            </header>

            {/* CONTENIDO */}
            <main className="inicio-main">

                <div className="rol-card">

                    <h1>
                        Escoge tu rol
                    </h1>

                    <p>
                        Selecciona el tipo de usuario para continuar
                    </p>

                    {/* APRENDIZ */}
                    <button
                        className="rol-button aprendiz"
                        onClick={() =>
                            navigate("/dashboard-aprendiz")
                        }
                    >
                        <div className="rol-icon">
                            🎓
                        </div>

                        <span>
                            Aprendiz
                        </span>

                        <strong>
                            →
                        </strong>
                    </button>

                    {/* ADMIN / COORDINADOR */}
                    <button
                        className="rol-button administrador"
                        onClick={() =>
                            navigate("/login-coordinador")
                        }
                    >
                        <div className="rol-icon">
                            🛡️
                        </div>

                        <span>
                            Admin / Coordinador
                        </span>

                        <strong>
                            →
                        </strong>
                    </button>

                </div>

            </main>

        </div>
    );
};

export default Inicio;