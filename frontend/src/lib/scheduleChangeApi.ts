import api, { ApiResponse, PaginatedResponse } from "./api";

// ══════════════════════════════════════════════════════════════════════════════
// Phase 2: Schedule Change Request API
// ══════════════════════════════════════════════════════════════════════════════

// Types
export interface ScheduleDataDTO {
  dayOfWeek: number;
  session: "morning" | "afternoon";
  startTime: string;
  endTime: string;
}

export interface ScheduleChangeRequestDTO {
  id: string;
  doctorId: string;
  doctorName: string;
  requestType: "add" | "remove" | "modify";
  oldScheduleData: ScheduleDataDTO | null;
  newScheduleData: ScheduleDataDTO | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ReviewScheduleChangeRequest {
  status: "approved" | "rejected";
  rejectionReason?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Doctor APIs
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all schedule change requests for the authenticated doctor
 */
export const getDoctorScheduleChangeRequests = async (
  status?: "pending" | "approved" | "rejected",
): Promise<ScheduleChangeRequestDTO[]> => {
  const response = await api.get<ApiResponse<ScheduleChangeRequestDTO[]>>(
    `/doctor/schedule-change-requests`,
    {
      params: status ? { status } : undefined,
    },
  );
  return response.data.data || [];
};

// ══════════════════════════════════════════════════════════════════════════════
// Admin APIs
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all schedule change requests (paginated)
 */
export const getAllScheduleChangeRequests = async (
  page: number = 1,
  pageSize: number = 20,
  status?: "pending" | "approved" | "rejected",
): Promise<PaginatedResponse<ScheduleChangeRequestDTO>> => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<ScheduleChangeRequestDTO>>
  >(`/admin/schedule-change-requests`, {
    params: { page, pageSize, status },
  });
  return (
    response.data.data || {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    }
  );
};

/**
 * Get all pending schedule change requests
 */
export const getPendingScheduleChangeRequests = async (): Promise<
  ScheduleChangeRequestDTO[]
> => {
  const response = await api.get<ApiResponse<ScheduleChangeRequestDTO[]>>(
    `/admin/schedule-change-requests/pending`,
  );
  return response.data.data || [];
};

/**
 * Get a specific schedule change request
 */
export const getScheduleChangeRequest = async (
  requestId: string,
): Promise<ScheduleChangeRequestDTO> => {
  const response = await api.get<ApiResponse<ScheduleChangeRequestDTO>>(
    `/admin/schedule-change-requests/${requestId}`,
  );
  if (!response.data.data) {
    throw new Error("Request not found");
  }
  return response.data.data;
};

/**
 * Approve a schedule change request
 */
export const approveScheduleChangeRequest = async (
  requestId: string,
): Promise<ScheduleChangeRequestDTO> => {
  const response = await api.post<ApiResponse<ScheduleChangeRequestDTO>>(
    `/admin/schedule-change-requests/${requestId}/approve`,
  );
  if (!response.data.data) {
    throw new Error("Failed to approve request");
  }
  return response.data.data;
};

/**
 * Reject a schedule change request
 */
export const rejectScheduleChangeRequest = async (
  requestId: string,
  rejectionReason: string,
): Promise<ScheduleChangeRequestDTO> => {
  const response = await api.post<ApiResponse<ScheduleChangeRequestDTO>>(
    `/admin/schedule-change-requests/${requestId}/reject`,
    {
      status: "rejected",
      rejectionReason,
    },
  );
  if (!response.data.data) {
    throw new Error("Failed to reject request");
  }
  return response.data.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get request type name in Vietnamese
 */
export const getRequestTypeName = (
  requestType: "add" | "remove" | "modify",
): string => {
  const names = {
    add: "Thêm lịch",
    remove: "Xóa lịch",
    modify: "Sửa lịch",
  };
  return names[requestType];
};

/**
 * Get status name in Vietnamese
 */
export const getStatusName = (
  status: "pending" | "approved" | "rejected",
): string => {
  const names = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
  };
  return names[status];
};

/**
 * Get status color for UI
 */
export const getStatusColor = (
  status: "pending" | "approved" | "rejected",
): string => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return colors[status];
};
