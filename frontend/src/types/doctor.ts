export interface DoctorProfile {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  specialty: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    doctorCount: number;
    createdAt: string;
    updatedAt: string;
  };
  qualifications: string | null;
  bio: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  workDate: string;
  slotStart: string;
  slotEnd: string;
  isBooked: boolean;
  createdAt: string;
}

export interface DoctorAppointment {
  id: string;
  patient: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  patientName: string;
  patientPhone?: string;
  patientEmail: string;
  doctor: {
    id: string;
    fullName: string;
    specialtyName: string;
    avatar: string | null;
    qualifications: string | null;
  };
  doctorId: string;
  healthRecord: {
    id: string;
    userId: string;
    fullName: string;
    dateOfBirth: string;
    ethnicity: string | null;
    gender: string;
    occupation: string | null;
    phone: string;
    email: string;
    nationalId: string | null;
    address: string;
    allergyNotes: string | null;
    medicalHistory: string | null;
    dentalStatus: string | null;
    createdAt: string;
    updatedAt: string;
  };
  timeSlot: {
    id: string;
    workScheduleId: string;
    startTime: string;
    endTime: string;
    maxPatientPerSlot: number;
    currentBookings?: number;
    remainingCapacity?: number;
    isAvailable?: boolean;
    createdAt: string;
  };
  service: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    duration: number;
    category: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  serviceId: string;
  serviceName: string;
  scheduleId: string;
  date: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  notes: string | null;
  patientNote?: string;
  doctorNote?: string;
  patientAllergies?: string;
  patientMedicalHistory?: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorDashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  totalPatients: number;
}

export interface PatientChatHistory {
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    mlLabel?: string;
    mlConfidence?: number;
    createdAt: string;
  }[];
}

export interface UpdateAppointmentNoteRequest {
  doctorNote: string;
}

export interface CompleteAppointmentRequest {
  doctorNote: string;
  diagnosis?: string;
  treatment?: string;
}
