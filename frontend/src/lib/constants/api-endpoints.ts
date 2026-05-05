const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE}/api/auth/login`,
    REGISTER: `${API_BASE}/api/auth/register`,
    LOGOUT: `${API_BASE}/api/auth/logout`,
    ME: `${API_BASE}/api/auth/me`,
    REFRESH: `${API_BASE}/api/auth/refresh`,
    GOOGLE_LOGIN: `${API_BASE}/api/auth/google`,
  },
  PATIENT: {
    PROFILE: `${API_BASE}/api/patient/profile`,
    APPOINTMENTS: `${API_BASE}/api/appointments/my`,
  },
  BOOKING: {
    DOCTORS: `${API_BASE}/api/doctors`,
    SERVICES: `${API_BASE}/api/services`,
    TIME_SLOTS: `${API_BASE}/api/schedules/available-slots`,
    CREATE: `${API_BASE}/api/appointments`,
    CANCEL: (id: string) => `${API_BASE}/api/appointments/${id}`,
  },
  ADMIN: {
    DASHBOARD: `${API_BASE}/api/admin/dashboard`,
    APPOINTMENTS: `${API_BASE}/api/admin/appointments`,
    PATIENTS: `${API_BASE}/api/admin/patients`,
    DOCTORS: `${API_BASE}/api/admin/doctors`,
  },
};
