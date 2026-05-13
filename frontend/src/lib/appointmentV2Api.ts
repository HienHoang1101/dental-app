import api, { ApiResponse } from "./api";

// ══════════════════════════════════════════════════════════════════════════════
// Phase 2: Appointment V2 API (Time-based booking)
// ══════════════════════════════════════════════════════════════════════════════

// Types
export interface CreateAppointmentRequestV2 {
  doctorId: string;
  startTime: string; // ISO 8601 timestamp
  endTime: string; // ISO 8601 timestamp
  serviceId: string;
  notes?: string;
  parentAppointmentId?: string; // For follow-ups
}

export interface AppointmentDTOV2 {
  id: string;
  patient: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
  };
  doctor: {
    id: string;
    fullName: string;
    specialtyName: string;
    avatar: string | null;
  };
  healthRecord: any;
  service: any;
  startTime: string | null; // ISO 8601 timestamp
  endTime: string | null; // ISO 8601 timestamp
  appointmentDate: string; // YYYY-MM-DD (for backward compatibility)
  status: string;
  notes: string | null;
  cancellationReason: string | null;
  parentAppointmentId: string | null;
  isFollowUp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowUpRequest {
  parentAppointmentId: string;
  startTime: string; // ISO 8601 timestamp
  endTime: string; // ISO 8601 timestamp
  notes?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Patient APIs
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Create appointment using V2 API (time-based booking)
 */
export const createAppointmentV2 = async (
  request: CreateAppointmentRequestV2,
): Promise<AppointmentDTOV2> => {
  const response = await api.post<ApiResponse<AppointmentDTOV2>>(
    `/appointments/v2`,
    request,
  );
  if (!response.data.data) {
    throw new Error(response.data.error || "Failed to create appointment");
  }
  return response.data.data;
};

/**
 * Get appointment details using V2 format
 */
export const getAppointmentV2 = async (
  appointmentId: string,
): Promise<AppointmentDTOV2> => {
  const response = await api.get<ApiResponse<AppointmentDTOV2>>(
    `/appointments/${appointmentId}/v2`,
  );
  if (!response.data.data) {
    throw new Error("Appointment not found");
  }
  return response.data.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Doctor APIs
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Create follow-up appointment (doctor only)
 */
export const createFollowUp = async (
  request: CreateFollowUpRequest,
): Promise<AppointmentDTOV2> => {
  const response = await api.post<ApiResponse<AppointmentDTOV2>>(
    `/appointments/follow-up`,
    request,
  );
  if (!response.data.data) {
    throw new Error(response.data.error || "Failed to create follow-up");
  }
  return response.data.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Convert date and time slot to ISO timestamps
 */
export const createTimestamps = (
  date: string, // YYYY-MM-DD
  startTime: string, // HH:mm
  endTime: string, // HH:mm
): { startTime: string; endTime: string } => {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const start = new Date(date);
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMin, 0, 0);

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

/**
 * Format appointment time for display
 */
export const formatAppointmentTime = (
  appointment: AppointmentDTOV2,
): string => {
  if (!appointment.startTime || !appointment.endTime) {
    return "Chưa xác định";
  }

  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);

  const formatTime = (date: Date) => {
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
};

/**
 * Validate appointment request
 */
export const validateAppointmentRequest = (
  request: CreateAppointmentRequestV2,
): string | null => {
  if (!request.doctorId) {
    return "Vui lòng chọn bác sĩ";
  }

  if (!request.serviceId) {
    return "Vui lòng chọn dịch vụ";
  }

  if (!request.startTime || !request.endTime) {
    return "Vui lòng chọn thời gian";
  }

  // Validate start < end
  const start = new Date(request.startTime);
  const end = new Date(request.endTime);

  if (start >= end) {
    return "Thời gian bắt đầu phải trước thời gian kết thúc";
  }

  // Validate not in the past
  const now = new Date();
  if (start < now) {
    return "Không thể đặt lịch trong quá khứ";
  }

  // Validate lead time (at least 2 hours from now)
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (start < twoHoursFromNow) {
    return "Vui lòng đặt lịch trước ít nhất 2 giờ";
  }

  // Validate booking window (max 30 days)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (start > thirtyDaysFromNow) {
    return "Chỉ có thể đặt lịch trong vòng 30 ngày";
  }

  return null;
};

/**
 * Check if appointment can have follow-up
 */
export const canCreateFollowUp = (appointment: AppointmentDTOV2): boolean => {
  // Must be completed
  if (appointment.status !== "completed") {
    return false;
  }

  // Must not already be a follow-up
  if (appointment.isFollowUp) {
    return false;
  }

  // Must be within 30 days
  if (!appointment.endTime) {
    return false;
  }

  const endDate = new Date(appointment.endTime);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysDiff <= 30;
};
