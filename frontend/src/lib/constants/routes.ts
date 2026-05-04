export const ROUTES = {
  // Public routes
<<<<<<< HEAD
  HOME: "/",

  // Auth routes
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",

  // Patient routes
  PATIENT_BOOKING: "/patient/booking",
  PATIENT_CHAT: "/patient/chat",
  PATIENT_HISTORY: "/patient/history",
  PATIENT_PROFILE: "/patient/profile",

  // Doctor routes
  DOCTOR_DASHBOARD: "/doctor/dashboard",
  DOCTOR_APPOINTMENTS: "/doctor/appointments",
  DOCTOR_SCHEDULE: "/doctor/schedule",
  DOCTOR_LEAVE_REQUESTS: "/doctor/leave-requests",
  DOCTOR_PATIENTS: "/doctor/patients",
  DOCTOR_PROFILE: "/doctor/profile",

  // Admin routes
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_APPOINTMENTS: "/admin/appointments",
  ADMIN_PATIENTS: "/admin/patients",
  ADMIN_DOCTORS: "/admin/doctors",
  ADMIN_SCHEDULES: "/admin/schedules",
  ADMIN_SERVICES: "/admin/services",
  ADMIN_KNOWLEDGE_BASE: "/admin/knowledge-base",
  ADMIN_CHAT_HISTORY: "/admin/chat-history",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = (typeof ROUTES)[RouteKey];
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
