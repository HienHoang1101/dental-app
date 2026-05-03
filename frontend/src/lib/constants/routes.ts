export const ROUTES = {
  // Public routes
  HOME: '/',
  
  // Auth routes
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // Patient routes
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_BOOKING: '/patient/booking',
  PATIENT_CHAT: '/patient/chat',
  PATIENT_HISTORY: '/patient/history',
  PATIENT_PROFILE: '/patient/profile',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_APPOINTMENTS: '/admin/appointments',
  ADMIN_PATIENTS: '/admin/patients',
  ADMIN_KNOWLEDGE_BASE: '/admin/knowledge-base',
  ADMIN_CHAT_HISTORY: '/admin/chat-history',
} as const

export type RouteKey = keyof typeof ROUTES
export type RouteValue = typeof ROUTES[RouteKey]
