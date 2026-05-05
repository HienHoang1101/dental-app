// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: "patient" | "doctor" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

// Health Record types
export interface HealthRecord {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  ethnicity?: string;
  gender: "male" | "female" | "other";
  occupation?: string;
  phone: string;
  email: string;
  nationalId?: string;
  address: string;
  allergyNotes?: string;
  medicalHistory?: string;
  dentalStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthRecordRequest {
  fullName: string;
  dateOfBirth: string;
  ethnicity?: string;
  gender: "male" | "female" | "other";
  occupation?: string;
  phone: string;
  email: string;
  nationalId?: string;
  address: string;
  allergyNotes?: string;
  medicalHistory?: string;
  dentalStatus?: string;
}

// Specialty types
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  doctorCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Doctor types
export interface DoctorSummary {
  id: string;
  fullName: string;
  specialty: string; // Changed from specialtyName to specialty (text)
  avatarUrl?: string; // Changed from avatar to avatarUrl
  degree?: string; // Changed from qualifications to degree
}

export interface Doctor {
  id: string;
  userId?: string; // Made optional (nullable in Supabase)
  user?: User; // Made optional
  fullName: string; // Added fullName
  specialty: string; // Changed from Specialty object to string
  degree?: string; // Changed from qualifications to degree
  bio?: string;
  avatarUrl?: string; // Changed from avatar to avatarUrl
  isActive: boolean;
  createdAt: string;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Time Slot types
export interface TimeSlot {
  id: string;
  workScheduleId: string;
  startTime: string;
  endTime: string;
  maxPatientPerSlot: number;
  currentBookings?: number;
  remainingCapacity?: number;
  isAvailable?: boolean;
  createdAt: string;
}

// Appointment types
export interface AppointmentSummary {
  id: string;
  patientName: string;
  doctorName: string;
  specialtyName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  serviceName?: string;
}

export interface Appointment {
  id: string;
  patient: User;
  doctor: DoctorSummary;
  healthRecord: HealthRecord;
  timeSlot: TimeSlot;
  service?: Service;
  appointmentDate: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  timeSlotId: string;
  serviceId?: string;
  appointmentDate: string;
  notes?: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalAppointments: number;
  totalPatients: number;
  totalRevenue: string;
  appointmentsByStatus: Record<string, number>;
  recentAppointments: AppointmentSummary[];
}

// Filter types
export interface DoctorFilter {
  specialtyId?: string;
  weekday?: string;
  gender?: string;
  sessionTime?: "morning" | "afternoon" | "evening";
  search?: string;
}

export interface AppointmentFilter {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  specialtyId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// Shift types
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

// Holiday types
export interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Work Schedule types
export interface WorkSchedule {
  id: string;
  doctor: DoctorSummary;
  shift: Shift;
  date: string;
  slotDuration: number;
  maxPatientPerSlot: number;
  timeSlots: TimeSlot[];
  createdAt: string;
}

// Leave Request types
export interface LeaveRequest {
  id: string;
  doctor: DoctorSummary;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: User;
  reviewedAt?: string;
  createdAt: string;
}
