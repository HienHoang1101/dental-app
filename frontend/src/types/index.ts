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
  doctorId?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Health Record types
export interface HealthRecord {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  ethnicity?: string;
  gender: string;
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

// Specialty types
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  doctorCount: number;
  createdAt: string;
  updatedAt: string;
}

// Doctor types
export interface Doctor {
  id: string;
  userId: string;
  user: User;
  specialty: Specialty;
  qualifications?: string;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
  specialtyName: string;
  avatar?: string;
  qualifications?: string;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: number;
  category?: string;
  specialtyId?: string;
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
  totalAmount: number;
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
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  timeSlotId: string;
  serviceId: string; // Now required
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
  totalDoctors: number;
  totalRevenue: string;
  totalRevenueAllTime: string;
  appointmentsByStatus: Record<string, number>;
  recentAppointments: AppointmentSummary[];
}

// Weekly Schedule Types
export interface WeeklySchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  session: "morning" | "afternoon";
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Medication types
export interface Medication {
  id: string;
  name: string;
  unit: string;
  price: number;
  description?: string;
  defaultDosage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Prescription types
export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medicationName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosageInstruction?: string;
}

export interface Prescription {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
  serviceName?: string;
  servicePrice: number;
  items: PrescriptionItem[];
  totalMedicationPrice: number;
  totalAmount: number;
  createdAt: string;
}

export interface CreatePrescriptionRequest {
  appointmentId?: string;
  patientId: string;
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
  items: {
    medicationId: string;
    quantity: number;
    dosageInstruction: string;
  }[];
}

// Schedule Change Request types
export interface ScheduleData {
  dayOfWeek: number;
  session: "morning" | "afternoon";
  startTime: string;
  endTime: string;
}

export interface ScheduleChangeRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  requestType: "add" | "remove" | "modify";
  oldScheduleData: ScheduleData | null;
  newScheduleData: ScheduleData | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
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
