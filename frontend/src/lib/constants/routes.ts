export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  PATIENT_DASHBOARD: "/patient/dashboard",
  PATIENT_BOOKING: "/booking",
  PATIENT_APPOINTMENTS: "/patient/appointments",
  PATIENT_PROFILE: "/patient/profile",
  PATIENT_NOTIFICATIONS: "/patient/notifications",

  DOCTOR_DASHBOARD: "/doctor/dashboard",
  DOCTOR_APPOINTMENTS: "/doctor/appointments",
  DOCTOR_SCHEDULE: "/doctor/schedule",
  DOCTOR_PATIENTS: "/doctor/patients",
  DOCTOR_PROFILE: "/doctor/profile",
  DOCTOR_NOTIFICATIONS: "/doctor/notifications",

  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_APPOINTMENTS: "/admin/appointments",
  ADMIN_PATIENTS: "/admin/patients",
  ADMIN_DOCTORS: "/admin/doctors",
  ADMIN_SERVICES: "/admin/services",
  ADMIN_SPECIALTIES: "/admin/specialties",
  ADMIN_SCHEDULES: "/admin/schedules",
  ADMIN_USERS: "/admin/users",
  ADMIN_NOTIFICATIONS: "/admin/notifications",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = (typeof ROUTES)[RouteKey];
