import api, { ApiResponse, PaginatedResponse } from "./api";
import {
  HealthRecord,
  CreateHealthRecordRequest,
  Specialty,
  Doctor,
  DoctorFilter,
  Service,
  TimeSlot,
  Appointment,
  CreateAppointmentRequest,
  AppointmentFilter,
  Notification,
  Holiday,
  WorkSchedule,
} from "@/types";

export const patientApi = {
  // Health Record
  getHealthRecord: async (): Promise<HealthRecord | null> => {
    try {
      const response =
        await api.get<ApiResponse<HealthRecord>>("/patient/profile");
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createHealthRecord: async (
    data: CreateHealthRecordRequest,
  ): Promise<HealthRecord> => {
    const response = await api.post<ApiResponse<HealthRecord>>(
      "/patient/profile",
      data,
    );
    return response.data.data!;
  },

  updateHealthRecord: async (
    data: Partial<CreateHealthRecordRequest>,
  ): Promise<HealthRecord> => {
    const response = await api.put<ApiResponse<HealthRecord>>(
      "/patient/profile",
      data,
    );
    return response.data.data!;
  },

  // Specialties
  getSpecialties: async (): Promise<Specialty[]> => {
    const response = await api.get<ApiResponse<Specialty[]>>("/specialties");
    return response.data.data || [];
  },

  // Doctors
  getDoctors: async (filter?: DoctorFilter): Promise<Doctor[]> => {
    const response = await api.get<ApiResponse<Doctor[]>>("/doctors", {
      params: filter,
    });
    return response.data.data || [];
  },

  getDoctorById: async (id: string): Promise<Doctor> => {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data.data!;
  },

  // Services
  getServices: async (
    category?: string,
    specialtyId?: string,
  ): Promise<Service[]> => {
    const response = await api.get<ApiResponse<Service[]>>("/services", {
      params: { category, specialtyId, activeOnly: true },
    });
    return response.data.data || [];
  },

  getServiceById: async (id: string): Promise<Service> => {
    const response = await api.get<ApiResponse<Service>>(`/services/${id}`);
    return response.data.data!;
  },

  getServicesByCategory: async (category: string): Promise<Service[]> => {
    return patientApi.getServices(category);
  },

  // Work Schedules & Time Slots
  getWorkSchedules: async (params: {
    doctorId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WorkSchedule[]> => {
    const response = await api.get<ApiResponse<WorkSchedule[]>>(
      `/schedules/work-schedules/doctor/${params.doctorId}`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    );
    return response.data.data || [];
  },

  getAvailableTimeSlots: async (params: {
    doctorId: string;
    date: string;
  }): Promise<TimeSlot[]> => {
    const response = await api.get<ApiResponse<TimeSlot[]>>(
      "/schedules/available-slots",
      { params },
    );
    return response.data.data || [];
  },

  // Holidays
  getHolidays: async (): Promise<Holiday[]> => {
    const response = await api.get<ApiResponse<Holiday[]>>(
      "/schedules/holidays",
    );
    return response.data.data || [];
  },

  // Appointments
  createAppointment: async (
    data: CreateAppointmentRequest,
  ): Promise<Appointment> => {
    const response = await api.post<ApiResponse<Appointment>>(
      "/appointments",
      data,
    );
    return response.data.data!;
  },

  getMyAppointments: async (
    filter?: AppointmentFilter,
  ): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Appointment>>>(
      "/patient/appointments",
      {
        params: filter,
      },
    );
    return response.data.data!;
  },

  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await api.get<ApiResponse<Appointment>>(
      `/appointments/${id}`,
    );
    return response.data.data!;
  },

  cancelAppointment: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/appointments/${id}`, {
      params: { reason: reason || "Không có lý do" },
    });
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<ApiResponse<Notification[]>>(
      "/patient/notifications",
    );
    return response.data.data || [];
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ count: number }>>(
      "/patient/notifications/unread-count",
    );
    return response.data.data?.count || 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/patient/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/patient/notifications/read-all");
  },
};
