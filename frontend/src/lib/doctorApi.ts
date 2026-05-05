import api, { ApiResponse, PaginatedResponse } from "./api";
import {
  Appointment,
  AppointmentFilter,
  WorkSchedule,
  LeaveRequest,
  Doctor,
  User,
  HealthRecord,
} from "@/types";

export const doctorApi = {
  // Profile
  getMyProfile: async (): Promise<Doctor> => {
    const response = await api.get<ApiResponse<Doctor>>("/doctor/profile");
    return response.data.data!;
  },

  updateMyProfile: async (data: Partial<Doctor>): Promise<Doctor> => {
    const response = await api.put<ApiResponse<Doctor>>(
      "/doctor/profile",
      data,
    );
    return response.data.data!;
  },

  // Appointments
  getMyAppointments: async (
    filter?: AppointmentFilter,
  ): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Appointment>>>(
      "/doctor/appointments",
      {
        params: filter,
      },
    );
    return response.data.data!;
  },

  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await api.get<ApiResponse<Appointment>>(
      `/doctor/appointments/${id}`,
    );
    return response.data.data!;
  },

  confirmAppointment: async (id: string): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(
      `/doctor/appointments/${id}/confirm`,
    );
    return response.data.data!;
  },

  cancelAppointment: async (
    id: string,
    reason: string,
  ): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(
      `/doctor/appointments/${id}/cancel`,
      {
        cancellationReason: reason,
      },
    );
    return response.data.data!;
  },

  // Patients
  getMyPatients: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>("/doctor/patients");
    return response.data.data || [];
  },

  getPatientHealthRecord: async (patientId: string): Promise<HealthRecord> => {
    const response = await api.get<ApiResponse<HealthRecord>>(
      `/doctor/patients/${patientId}/health-record`,
    );
    return response.data.data!;
  },

  // Work Schedule
  getMyWorkSchedules: async (
    startDate: string,
    endDate: string,
  ): Promise<WorkSchedule[]> => {
    const response = await api.get<ApiResponse<WorkSchedule[]>>(
      "/doctor/work-schedules",
      {
        params: { startDate, endDate },
      },
    );
    return response.data.data || [];
  },

  registerWorkSchedule: async (data: {
    shiftId: string;
    date: string;
  }): Promise<WorkSchedule> => {
    const response = await api.post<ApiResponse<WorkSchedule>>(
      "/doctor/work-schedules",
      data,
    );
    return response.data.data!;
  },

  // Leave Requests
  getMyLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const response = await api.get<ApiResponse<LeaveRequest[]>>(
      "/doctor/leave-requests",
    );
    return response.data.data || [];
  },

  createLeaveRequest: async (data: {
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> => {
    const response = await api.post<ApiResponse<LeaveRequest>>(
      "/doctor/leave-requests",
      data,
    );
    return response.data.data!;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get<ApiResponse<any[]>>("/notifications");
    return response.data.data || [];
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ count: number }>>(
      "/notifications/unread-count",
    );
    return response.data.data?.count || 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },
};
