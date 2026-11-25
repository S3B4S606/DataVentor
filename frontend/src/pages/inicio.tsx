import { useNavigate } from "react-router-dom";
import "../styles/Aprendiz/inicio.css";

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
                <source src="/FondoData.mp4" type="video/mp4" />
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
                        {"Gesti\u00f3n de equipos en ambientes SENA"}
                    </small>
                </div>

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
                            navigate("/seleccionar-ambiente-aprendiz")
                        }
                    >
                        <div className="rol-icon">
                            {"\uD83C\uDF93"}
                        </div>

                        <span>Aprendiz</span>

                        <strong>{"\u2192"}</strong>
                    </button>

                    {/* ADMIN / COORDINADOR */}
                    <button
                        className="rol-button administrador"
                        onClick={() =>
                            navigate("/login-coordinador")
                        }
                    >
                        <div className="rol-icon">
                            {"\uD83D\uDEE1\uFE0F"}
                        </div>

                        <span>Admin / Coordinador</span>

                        <strong>{"\u2192"}</strong>
                    </button>

                    {/* TECNICO */}
                    <button
                        className="rol-button tecnico"
                        onClick={() =>
                            navigate("/login-tecnico")
                        }
                    >
                        <div className="rol-icon">
                            {"\u2699\uFE0F"}
                        </div>

                        <span>{"T\u00e9cnico"}</span>

                        <strong>{"\u2192"}</strong>
                    </button>

                    {/* INSTRUCTOR */}
                    <button
                        className="rol-button instructor"
                        onClick={() =>
                            navigate("/login-instructor")
                        }
                    >
                        <div className="rol-icon">
                            {"\uD83D\uDCBB"}
                        </div>

                        <span>Instructor</span>

                        <strong>{"\u2192"}</strong>
                    </button>

                </div>

            </main>

        </div>
    );
};

export default Inicio;
