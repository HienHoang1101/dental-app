import api, { ApiResponse } from "./api";

// ══════════════════════════════════════════════════════════════════════════════
// Phase 2: Weekly Schedule API
// ══════════════════════════════════════════════════════════════════════════════

// Types
export interface WeeklyScheduleDTO {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 1=Mon, 7=Sun
  session: "morning" | "afternoon";
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeeklyScheduleRequest {
  dayOfWeek: number;
  session: "morning" | "afternoon";
  startTime?: string; // Optional, defaults based on session
  endTime?: string; // Optional, defaults based on session
}

export interface AvailableSlotDTO {
  start: string; // ISO 8601 timestamp
  end: string; // ISO 8601 timestamp
}

export interface AvailableSlotsResponse {
  date: string;
  doctorId: string;
  slots: AvailableSlotDTO[];
}

// ══════════════════════════════════════════════════════════════════════════════
// Public APIs (no auth required)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get weekly schedules for a doctor
 * Public endpoint - no authentication required
 */
export const getWeeklySchedules = async (
  doctorId: string,
): Promise<WeeklyScheduleDTO[]> => {
  const response = await api.get<ApiResponse<WeeklyScheduleDTO[]>>(
    `/doctors/${doctorId}/weekly-schedules`,
  );
  return response.data.data || [];
};

/**
 * Get available time slots for a doctor on a specific date
 * Public endpoint - no authentication required
 */
export const getAvailableSlots = async (
  doctorId: string,
  date: string, // YYYY-MM-DD format
): Promise<AvailableSlotDTO[]> => {
  const response = await api.get<ApiResponse<AvailableSlotsResponse>>(
    `/doctors/${doctorId}/available-slots`,
    {
      params: { date },
    },
  );
  return response.data.data?.slots || [];
};

// ══════════════════════════════════════════════════════════════════════════════
// Doctor APIs (requires doctor authentication)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Doctor requests to add a new weekly schedule
 * Creates a schedule change request that needs admin approval
 */
export const requestAddSchedule = async (
  request: CreateWeeklyScheduleRequest,
): Promise<any> => {
  const response = await api.post<ApiResponse<any>>(
    `/doctor/weekly-schedules`,
    request,
  );
  return response.data.data;
};

/**
 * Doctor requests to modify an existing schedule
 * Creates a schedule change request that needs admin approval
 */
export const requestModifySchedule = async (
  scheduleId: string,
  request: Partial<CreateWeeklyScheduleRequest>,
): Promise<any> => {
  const response = await api.put<ApiResponse<any>>(
    `/doctor/weekly-schedules/${scheduleId}`,
    request,
  );
  return response.data.data;
};

/**
 * Doctor requests to remove a schedule
 * Creates a schedule change request that needs admin approval
 */
export const requestRemoveSchedule = async (
  scheduleId: string,
): Promise<any> => {
  const response = await api.delete<ApiResponse<any>>(
    `/doctor/weekly-schedules/${scheduleId}`,
  );
  return response.data.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get day name from day of week number
 */
export const getDayName = (dayOfWeek: number): string => {
  const days = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  return days[dayOfWeek === 7 ? 0 : dayOfWeek];
};

/**
 * Get session name in Vietnamese
 */
export const getSessionName = (session: "morning" | "afternoon"): string => {
  return session === "morning" ? "Sáng" : "Chiều";
};

/**
 * Format time slot for display
 */
export const formatTimeSlot = (slot: AvailableSlotDTO): string => {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  return `${start.getHours()}:${start.getMinutes().toString().padStart(2, "0")} - ${end.getHours()}:${end.getMinutes().toString().padStart(2, "0")}`;
};

/**
 * Get default session times
 */
export const getDefaultSessionTimes = (
  session: "morning" | "afternoon",
): { startTime: string; endTime: string } => {
  if (session === "morning") {
    return { startTime: "08:00", endTime: "12:00" };
  } else {
    return { startTime: "13:30", endTime: "17:30" };
  }
};
