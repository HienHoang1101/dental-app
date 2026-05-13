import api, { ApiResponse, PaginatedResponse } from "./api";
import {
  Appointment,
  AppointmentFilter,
  WorkSchedule,
  LeaveRequest,
  Doctor,
  User,
  HealthRecord,
  Medication,
  Prescription,
  CreatePrescriptionRequest,
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
        params: { ...filter, _t: Date.now() },
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

  completeAppointment: async (id: string): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(
      `/doctor/appointments/${id}/complete`,
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

  // V2: Weekly schedule management
  getMyWeeklySchedules: async (): Promise<
    Array<{
      id: string;
      doctorId: string;
      dayOfWeek: number;
      session: "morning" | "afternoon";
      startTime: string;
      endTime: string;
      isActive: boolean;
    }>
  > => {
    // Get from auth-storage (Zustand persist)
    const authStorage = localStorage.getItem("auth-storage");
    const authData = authStorage ? JSON.parse(authStorage) : null;
    const doctorId = authData?.state?.user?.doctorId;

    if (!doctorId) throw new Error("Doctor ID not found");

    const response = await api.get<
      ApiResponse<
        Array<{
          id: string;
          doctorId: string;
          dayOfWeek: number;
          session: "morning" | "afternoon";
          startTime: string;
          endTime: string;
          isActive: boolean;
        }>
      >
    >(`/doctors/${doctorId}/weekly-schedules`);
    return response.data.data || [];
  },

  requestScheduleChange: async (data: {
    requestType: "add" | "remove" | "modify";
    oldScheduleData?: any;
    newScheduleData?: any;
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(
      "/doctor/schedule-change-requests",
      data,
    );
    return response.data.data!;
  },

  getMyScheduleChangeRequests: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(
      "/doctor/schedule-change-requests",
    );
    return response.data.data || [];
  },

  createFollowUpAppointment: async (data: {
    parentAppointmentId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<Appointment> => {
    const response = await api.post<ApiResponse<Appointment>>(
      "/doctor/appointments/follow-up",
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

  // Prescriptions
  getMedications: async (activeOnly: boolean = true): Promise<Medication[]> => {
    const response = await api.get<ApiResponse<Medication[]>>("/medications", {
      params: { activeOnly },
    });
    return response.data.data || [];
  },

  createPrescription: async (
    data: CreatePrescriptionRequest,
  ): Promise<Prescription> => {
    const response = await api.post<ApiResponse<Prescription>>(
      "/prescriptions",
      data,
    );
    return response.data.data!;
  },

  getPrescriptionByAppointment: async (
    appointmentId: string,
  ): Promise<Prescription | null> => {
    try {
      const response = await api.get<ApiResponse<Prescription>>(
        `/appointments/${appointmentId}/prescription`,
      );
      return response.data.data!;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },
};
