
import { Routes, Route, Navigate } from "react-router-dom";

import Inicio from "../pages/Inicio";

// ADMINISTRADOR / COORDINADOR
import DashboardAdmin from "../pages/AdminCoordinador/DashboardAdmin";
import DashboardAmbientes from "../pages/AdminCoordinador/DashboardAmbientes";
import LoginCoordinador from "../pages/AdminCoordinador/LoginCoordinador";
import RegistrarAmbiente from "../pages/AdminCoordinador/RegistrarAmbiente";
import RecuperarContrasena from "../pages/AdminCoordinador/RecuperarContrasena";
import RestablecerContrasena from "../pages/AdminCoordinador/RestablecerContrasena";
import GestionReportes from "../pages/AdminCoordinador/GestionReportes";

// APRENDIZ
import DashboardAprendiz from "../pages/Aprendiz/DashboardAprendiz";
import LoginAprendiz from "../pages/Aprendiz/LoginAprendiz";
import CrearReporte from "../pages/Aprendiz/CrearReporte";

// TÉCNICO
import LoginTecnico from "../pages/Tecnico/LoginTecnico";
import DashboardTecnico from "../pages/Tecnico/DashboardTecnico";
import MisReportesTecnico from "../pages/Tecnico/MisReportesTecnico";
import DetalleReporte from "../pages/Tecnico/DetalleReporte";

// INSTRUCTOR
import LoginInstructor from "../pages/Instructor/LoginInstructor";
import DashboardInstructor from "../pages/Instructor/DashboardInstructor";
import CrearReporteInstructor from "../pages/Instructor/CrearReporteInstructor";
import MisReportesInstructor from "../pages/Instructor/MisReportesInstructor";

export default function AppRoutes() {
  return (
    <Routes>
      {/* INICIO */}
      <Route path="/" element={<Inicio />} />

      {/* APRENDIZ */}
      <Route
        path="/dashboard-aprendiz"
        element={<DashboardAprendiz />}
      />
      <Route
        path="/crear-reporte"
        element={<CrearReporte />}
      />
      <Route
        path="/login-aprendiz"
        element={<LoginAprendiz />}
      />

      {/* ADMINISTRADOR / COORDINADOR */}
      <Route
        path="/login-coordinador"
        element={<LoginCoordinador />}
      />
      <Route
        path="/recuperar-contrasena"
        element={<RecuperarContrasena />}
      />
      <Route
        path="/restablecer-contrasena"
        element={<RestablecerContrasena />}
      />
      <Route
        path="/gestion-reportes"
        element={<GestionReportes />}
      />
      <Route
        path="/dashboard-admin"
        element={<DashboardAdmin />}
      />
      <Route
        path="/ambientes"
        element={<DashboardAmbientes />}
      />
      <Route
        path="/registrar-ambiente"
        element={<RegistrarAmbiente />}
      />

      {/* TÉCNICO */}
      <Route
        path="/login-tecnico"
        element={<LoginTecnico />}
      />
      <Route
        path="/dashboard-tecnico"
        element={<DashboardTecnico />}
      />
      <Route
        path="/mis-reportes-tecnico"
        element={<MisReportesTecnico />}
      />
      <Route
        path="/detalle-reporte/:id"
        element={<DetalleReporte />}
      />

      {/* INSTRUCTOR */}
      <Route
        path="/login-instructor"
        element={<LoginInstructor />}
      />
      <Route
        path="/dashboard-instructor"
        element={<DashboardInstructor />}
      />
      <Route
        path="/crear-reporte-instructor"
        element={<CrearReporteInstructor />}
      />
      <Route
        path="/mis-reportes-instructor"
        element={<MisReportesInstructor />}
      />

      {/* RUTAS DESCONOCIDAS */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
