const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const ML_API_BASE = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE}/api/auth/login`,
    REGISTER: `${API_BASE}/api/auth/register`,
    GOOGLE_LOGIN: `${API_BASE}/api/auth/google`,
    LOGOUT: `${API_BASE}/api/auth/logout`,
    REFRESH: `${API_BASE}/api/auth/refresh`,
    ME: `${API_BASE}/api/auth/me`,
  },
  
  // Patient endpoints
  PATIENT: {
    PROFILE: `${API_BASE}/api/patient/profile`,
    UPDATE_PROFILE: `${API_BASE}/api/patient/profile`,
    APPOINTMENTS: `${API_BASE}/api/patient/appointments`,
  },
  
  // Booking endpoints
  BOOKING: {
    DOCTORS: `${API_BASE}/api/booking/doctors`,
    SERVICES: `${API_BASE}/api/booking/services`,
    TIME_SLOTS: `${API_BASE}/api/booking/time-slots`,
    CREATE: `${API_BASE}/api/booking/create`,
    CANCEL: (id: string) => `${API_BASE}/api/booking/${id}/cancel`,
  },
  
  // Chat endpoints
  CHAT: {
    SESSIONS: `${API_BASE}/api/chat/sessions`,
    MESSAGES: (sessionId: string) => `${API_BASE}/api/chat/sessions/${sessionId}/messages`,
    SEND: `${ML_API_BASE}/api/v1/chat`,
  },
  
  // ML endpoints
  ML: {
    CLASSIFY_SYMPTOM: `${ML_API_BASE}/api/v1/symptom/classify`,
    CHAT: `${ML_API_BASE}/api/v1/chat`,
    HEALTH: `${ML_API_BASE}/api/v1/health`,
  },
  
  // Admin endpoints
  ADMIN: {
    DASHBOARD: `${API_BASE}/api/admin/dashboard`,
    APPOINTMENTS: `${API_BASE}/api/admin/appointments`,
    APPOINTMENT_DETAIL: (id: string) => `${API_BASE}/api/admin/appointments/${id}`,
    CONFIRM_APPOINTMENT: (id: string) => `${API_BASE}/api/admin/appointments/${id}/confirm`,
    CANCEL_APPOINTMENT: (id: string) => `${API_BASE}/api/admin/appointments/${id}/cancel`,
    PATIENTS: `${API_BASE}/api/admin/patients`,
    PATIENT_DETAIL: (id: string) => `${API_BASE}/api/admin/patients/${id}`,
    KNOWLEDGE_BASE: `${API_BASE}/api/admin/knowledge-base`,
    UPLOAD_KB: `${API_BASE}/api/admin/knowledge-base/upload`,
    DELETE_KB: (id: string) => `${API_BASE}/api/admin/knowledge-base/${id}`,
    CHAT_HISTORY: `${API_BASE}/api/admin/chat-history`,
  },
} as const
