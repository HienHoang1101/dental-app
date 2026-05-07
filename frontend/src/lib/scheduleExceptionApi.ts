import api, { ApiResponse } from "./api";

// ══════════════════════════════════════════════════════════════════════════════
// Phase 2: Schedule Exception API
// ══════════════════════════════════════════════════════════════════════════════

// Types
export interface ScheduleExceptionDTO {
  id: string;
  doctorId: string;
  exceptionDate: string; // YYYY-MM-DD
  exceptionType: "off" | "override";
  session: "morning" | "afternoon" | null; // null = entire day
  overrideStartTime: string | null; // HH:mm format
  overrideEndTime: string | null; // HH:mm format
  reason: string | null;
  createdAt: string;
}

export interface CreateExceptionRequest {
  exceptionDate: string; // YYYY-MM-DD
  exceptionType: "off" | "override";
  session?: "morning" | "afternoon" | null;
  overrideStartTime?: string; // HH:mm format
  overrideEndTime?: string; // HH:mm format
  reason?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Doctor APIs
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all schedule exceptions for the authenticated doctor
 */
export const getDoctorScheduleExceptions = async (
  startDate?: string,
  endDate?: string,
): Promise<ScheduleExceptionDTO[]> => {
  const response = await api.get<ApiResponse<ScheduleExceptionDTO[]>>(
    `/doctor/schedule-exceptions`,
    {
      params: { startDate, endDate },
    },
  );
  return response.data.data || [];
};

/**
 * Create a schedule exception (day off or override)
 */
export const createScheduleException = async (
  request: CreateExceptionRequest,
): Promise<ScheduleExceptionDTO> => {
  const response = await api.post<ApiResponse<ScheduleExceptionDTO>>(
    `/doctor/schedule-exceptions`,
    request,
  );
  if (!response.data.data) {
    throw new Error("Failed to create exception");
  }
  return response.data.data;
};

/**
 * Delete a schedule exception
 */
export const deleteScheduleException = async (
  exceptionId: string,
): Promise<void> => {
  await api.delete(`/doctor/schedule-exceptions/${exceptionId}`);
};

// ══════════════════════════════════════════════════════════════════════════════
// Admin APIs
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get schedule exceptions for any doctor (admin only)
 */
export const getAdminScheduleExceptions = async (
  doctorId: string,
  startDate?: string,
  endDate?: string,
): Promise<ScheduleExceptionDTO[]> => {
  const response = await api.get<ApiResponse<ScheduleExceptionDTO[]>>(
    `/admin/doctors/${doctorId}/schedule-exceptions`,
    {
      params: { startDate, endDate },
    },
  );
  return response.data.data || [];
};

/**
 * Create a schedule exception for any doctor (admin only)
 */
export const createAdminScheduleException = async (
  doctorId: string,
  request: CreateExceptionRequest,
): Promise<ScheduleExceptionDTO> => {
  const response = await api.post<ApiResponse<ScheduleExceptionDTO>>(
    `/admin/doctors/${doctorId}/schedule-exceptions`,
    request,
  );
  if (!response.data.data) {
    throw new Error("Failed to create exception");
  }
  return response.data.data;
};

/**
 * Delete any schedule exception (admin only)
 */
export const deleteAdminScheduleException = async (
  exceptionId: string,
): Promise<void> => {
  await api.delete(`/admin/schedule-exceptions/${exceptionId}`);
};

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get exception type name in Vietnamese
 */
export const getExceptionTypeName = (
  exceptionType: "off" | "override",
): string => {
  return exceptionType === "off" ? "Nghỉ" : "Thay đổi giờ";
};

/**
 * Get session name in Vietnamese
 */
export const getSessionName = (
  session: "morning" | "afternoon" | null,
): string => {
  if (session === null) return "Cả ngày";
  return session === "morning" ? "Sáng" : "Chiều";
};

/**
 * Format exception for display
 */
export const formatException = (exception: ScheduleExceptionDTO): string => {
  const date = new Date(exception.exceptionDate).toLocaleDateString("vi-VN");
  const type = getExceptionTypeName(exception.exceptionType);
  const session = getSessionName(exception.session);

  if (exception.exceptionType === "off") {
    return `${type} ${session} - ${date}`;
  } else {
    return `${type} (${exception.overrideStartTime} - ${exception.overrideEndTime}) - ${date}`;
  }
};

/**
 * Validate exception request
 */
export const validateExceptionRequest = (
  request: CreateExceptionRequest,
): string | null => {
  if (!request.exceptionDate) {
    return "Vui lòng chọn ngày";
  }

  if (!request.exceptionType) {
    return "Vui lòng chọn loại ngoại lệ";
  }

  if (request.exceptionType === "override") {
    if (!request.overrideStartTime || !request.overrideEndTime) {
      return "Vui lòng nhập giờ bắt đầu và kết thúc";
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (
      !timeRegex.test(request.overrideStartTime) ||
      !timeRegex.test(request.overrideEndTime)
    ) {
      return "Định dạng giờ không hợp lệ (HH:mm)";
    }

    // Validate start < end
    const [startHour, startMin] = request.overrideStartTime
      .split(":")
      .map(Number);
    const [endHour, endMin] = request.overrideEndTime.split(":").map(Number);
    if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
      return "Giờ bắt đầu phải trước giờ kết thúc";
    }
  }

  return null;
};
