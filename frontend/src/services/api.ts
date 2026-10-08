const API_URL = "http://127.0.0.1:5001";

// ==============================
// INTERFACES
// ==============================

export interface Reporte {
  id_reporte?: number;
  id_equipo: number;
  id_usuario: number;

  descripcion: string;

  prioridad: "baja" | "media" | "alta";

  estado_reporte?:
    | "pendiente"
    | "en_revision"
    | "resuelto"
    | "cerrado";

  fecha_reporte?: string;
  fecha_cierre?: string | null;
  fecha_actualizacion?: string | null;

  serial?: string;
  registro_unico?: string;
  tipo?: string;
  modelo?: string;
  id_ambiente?: number;

  nombre?: string;
  apellido?: string;
  correo?: string;
}

export interface ActualizarEstadoPayload {
  estado:
    | "pendiente"
    | "en_revision"
    | "resuelto"
    | "cerrado";

  id_usuario: number;

  observaciones?: string;
}

export interface RegistroResponse {
  mensaje: string;

  usuario?: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    tipo_documento: string;
    documento: string;
    correo: string;
    rol: string;
  };
}

export interface HistorialReporte {
  id_historial: number;
  id_reporte: number;
  id_usuario: number;
  estado:
    | "pendiente"
    | "en_revision"
    | "resuelto"
    | "cerrado";
  fecha: string;
  observaciones?: string | null;
  nombre?: string;
  apellido?: string;
  correo?: string;
}

// ==============================
// INTERFACE INICIO
// ==============================

export interface InicioResponse {
  mensaje: string;
  estado: string;

  roles: {
    nombre: string;
    ruta: string;
  }[];
}

// ==============================
// PETICIÓN GENERAL
// ==============================

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      errorData.mensaje ||
        `Error en la petición: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// ==============================
// API
// ==============================

export const api = {

  // ==============================
  // SALUD DEL BACKEND
  // ==============================

  comprobarBackend: (): Promise<{
    backend: string;
    estado: string;
  }> => {
    return request("/api/salud");
  },

  // ==============================
  // INICIO
  // ==============================

  getInicio: (): Promise<InicioResponse> => {
    return request<InicioResponse>("/api/inicio");
  },

  // ==============================
  // REGISTRO DE USUARIOS
  // ==============================

  registrar: (datos: {
    tipo_documento: string;
    documento: string;
    nombre: string;
    apellido: string;
    correo: string;
    contrasena: string;
    rol: string;
  }): Promise<RegistroResponse> => {
    return request<RegistroResponse>(
      "/api/registro",
      {
        method: "POST",
        body: JSON.stringify(datos),
      }
    );
  },

  // ==============================
  // REPORTES
  // ==============================

  getReportes: (
    id_usuario?: number
  ): Promise<Reporte[]> => {

    const url = id_usuario
      ? `/api/reportes?usuario=${id_usuario}`
      : "/api/reportes";

    return request<Reporte[]>(url);
  },

  // ==============================
  // REPORTE POR ID
  // ==============================

  getReporteById: (
    id: number
  ): Promise<Reporte> => {

    return request<Reporte>(
      `/api/reportes/${id}`
    );
  },

  // ==============================
  // CREAR REPORTE
  // ==============================

  crearReporte: (
    reporte: Reporte
  ): Promise<{
    mensaje: string;
    id_reporte: number;
  }> => {

    return request(
      "/api/reportes",
      {
        method: "POST",
        body: JSON.stringify(reporte),
      }
    );
  },

  // ==============================
  // ACTUALIZAR ESTADO DEL REPORTE
  // ==============================

  actualizarEstadoReporte: (
    id: number,
    datos: ActualizarEstadoPayload
  ): Promise<{
    mensaje: string;
  }> => {

    return request(
      `/api/reportes/${id}/estado`,
      {
        method: "PUT",
        body: JSON.stringify(datos),
      }
    );
  },

  // ==============================
  // HISTORIAL DEL REPORTE
  // ==============================

  getHistorialReporte: (
    id: number
  ): Promise<HistorialReporte[]> => {

    return request<HistorialReporte[]>(
      `/api/reportes/${id}/historial`
    );
  },

  // ==============================
  // EQUIPOS
  // ==============================

  getEquipos: () => {
    return request("/api/equipos");
  },

  // ==============================
  // EQUIPO POR ID
  // ==============================

  getEquipoById: (
    id: number
  ) => {

    return request(
      `/api/equipos/${id}`
    );
  },

  // ==============================
  // IDENTIFICAR EQUIPO AUTOMÁTICAMENTE
  // ==============================

  getIdentificadorEquipo: () => {

    return request(
      "/api/equipos/identificador"
    );
  },
};