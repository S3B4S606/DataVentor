import { Routes, Route, Navigate } from "react-router-dom";

import Inicio from "../pages/Inicio";
import DashboardAdmin from "../pages/AdminCoordinador/DashboardAdmin";
import DashboardAmbientes from "../pages/AdminCoordinador/DashboardAmbientes";
import LoginCoordinador from "../pages/AdminCoordinador/LoginCoordinador";
import RegistrarAmbiente from "../pages/AdminCoordinador/RegistrarAmbiente";
import DashboardAprendiz from "../pages/Aprendiz/DashboardAprendiz";
import CrearReporte from "../pages/Aprendiz/CrearReporte";
import DashboardTecnico from "../pages/Tecnico/DashboardTecnico";
import MisReportesTecnico from "../pages/Tecnico/MisReportesTecnico"; // Asegúrate de que la ruta sea correcta según tu estructura de archivosT


export default function AppRoutes() {
  return (
    <Routes>

      {/* INICIO */}
      <Route
        path="/"
        element={<Inicio />}
      />

      {/* APRENDIZ */}
      <Route
        path="/dashboard-aprendiz"
        element={<DashboardAprendiz />}
      />

      {/* ADMINISTRADOR */}
      <Route
        path="/dashboard-admin"
        element={<DashboardAdmin />}
      />

      {/* LOGIN_COORDINADOR */}
      <Route
        path="/login-coordinador"
        element={<LoginCoordinador />}
      />

      {/* AMBIENTES */}
      <Route
        path="/ambientes"
        element={<DashboardAmbientes />}
      />

      {/* REGISTRAR_AMBIENTE */}
      <Route
        path="/registrar-ambiente"
        element={<RegistrarAmbiente />}
      />

      {/* CREAR REPORTE */}
      <Route
        path="/crear-reporte"
        element={<CrearReporte />}
      />

      {/* CUALQUIER RUTA DESCONOCIDA */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

      {/* TECNICO */}
      <Route
        path="/dashboard-tecnico"
        element={<DashboardTecnico />}
      />  

      <Route
        path="/mis-reportes-tecnico"
        element={<MisReportesTecnico />}
      />

    </Routes>
  );
}