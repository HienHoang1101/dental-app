import api, { ApiResponse, PaginatedResponse } from "./api";
import {
  User,
  HealthRecord,
  Doctor,
  Service,
  Specialty,
  Appointment,
  WorkSchedule,
  LeaveRequest,
  Shift,
  Holiday,
  DashboardStats,
} from "@/types";

export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>(
      "/admin/dashboard/stats",
    );
    return response.data.data!;
  },

  // Patients
  getPatients: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<any> => {
    const response = await api.get<ApiResponse<any>>("/admin/patients", {
      params,
    });
    return response.data.data!;
  },

  getPatient: async (id: string): Promise<HealthRecord> => {
    const response = await api.get<ApiResponse<HealthRecord>>(
      `/admin/patients/${id}`,
    );
    return response.data.data!;
  },

  updatePatient: async (
    id: string,
    data: Partial<HealthRecord>,
  ): Promise<HealthRecord> => {
    const response = await api.put<ApiResponse<HealthRecord>>(
      `/admin/patients/${id}`,
      data,
    );
    return response.data.data!;
  },

  deletePatient: async (id: string): Promise<void> => {
    await api.delete(`/admin/patients/${id}`);
  },

  // Doctors
  getDoctors: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<Doctor[]> => {
    const response = await api.get<ApiResponse<Doctor[]>>("/admin/doctors", {
      params,
    });
    return response.data.data || [];
  },

  getDoctor: async (id: string): Promise<Doctor> => {
    const response = await api.get<ApiResponse<Doctor>>(`/admin/doctors/${id}`);
    return response.data.data!;
  },

  createDoctor: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    specialty: string;
    degree?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<Doctor> => {
    const response = await api.post<ApiResponse<Doctor>>(
      "/admin/doctors",
      data,
    );
    return response.data.data!;
  },

  updateDoctor: async (id: string, data: Partial<Doctor>): Promise<Doctor> => {
    const response = await api.put<ApiResponse<Doctor>>(
      `/admin/doctors/${id}`,
      data,
    );
    return response.data.data!;
  },

  deleteDoctor: async (id: string): Promise<void> => {
    await api.delete(`/admin/doctors/${id}`);
  },

  // Services
  getServices: async (): Promise<Service[]> => {
    const response = await api.get<ApiResponse<Service[]>>("/services", {
      params: { activeOnly: false },
    });
    return response.data.data || [];
  },

  createService: async (data: {
    name: string;
    description?: string;
    price: number; // Changed from string to number
    duration: number;
    category?: string;
  }): Promise<Service> => {
    const response = await api.post<ApiResponse<Service>>("/services", data);
    return response.data.data!;
  },

  updateService: async (
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      price: number; // Changed from string to number
      duration: number;
      category?: string;
      isActive?: boolean;
    }>,
  ): Promise<Service> => {
    const response = await api.put<ApiResponse<Service>>(
      `/services/${id}`,
      data,
    );
    return response.data.data!;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },

  // Specialties
  getSpecialties: async (): Promise<Specialty[]> => {
    const response = await api.get<ApiResponse<Specialty[]>>("/specialties", {
      params: { activeOnly: false },
    });
    return response.data.data || [];
  },

  createSpecialty: async (data: {
    name: string;
    description?: string;
  }): Promise<Specialty> => {
    const response = await api.post<ApiResponse<Specialty>>(
      "/specialties",
      data,
    );
    return response.data.data!;
  },

  updateSpecialty: async (
    id: string,
    data: Partial<Specialty>,
  ): Promise<Specialty> => {
    const response = await api.put<ApiResponse<Specialty>>(
      `/specialties/${id}`,
      data,
    );
    return response.data.data!;
  },

  deleteSpecialty: async (id: string): Promise<void> => {
    await api.delete(`/specialties/${id}`);
  },

  // Appointments
  getAllAppointments: async (filter?: {
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Appointment>>>(
      "/admin/appointments",
      {
        params: filter,
      },
    );
    return response.data.data!;
  },

  updateAppointment: async (
    id: string,
    data: {
      status?: string;
      notes?: string;
    },
  ): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(
      `/admin/appointments/${id}`,
      data,
    );
    return response.data.data!;
  },

  // Shifts
  getShifts: async (): Promise<Shift[]> => {
    const response = await api.get<ApiResponse<Shift[]>>("/schedules/shifts");
    return response.data.data || [];
  },

  createShift: async (data: {
    name: string;
    startTime: string;
    endTime: string;
  }): Promise<Shift> => {
    const response = await api.post<ApiResponse<Shift>>(
      "/schedules/shifts",
      data,
    );
    return response.data.data!;
  },

  updateShift: async (id: string, data: Partial<Shift>): Promise<Shift> => {
    const response = await api.put<ApiResponse<Shift>>(
      `/schedules/shifts/${id}`,
      data,
    );
    return response.data.data!;
  },

  deleteShift: async (id: string): Promise<void> => {
    await api.delete(`/schedules/shifts/${id}`);
  },

  // Holidays
  getHolidays: async (): Promise<Holiday[]> => {
    const response = await api.get<ApiResponse<Holiday[]>>(
      "/schedules/holidays",
    );
    return response.data.data || [];
  },

  createHoliday: async (data: {
    date: string;
    name: string;
    description?: string;
  }): Promise<Holiday> => {
    const response = await api.post<ApiResponse<Holiday>>(
      "/schedules/holidays",
      data,
    );
    return response.data.data!;
  },

  deleteHoliday: async (id: string): Promise<void> => {
    await api.delete(`/schedules/holidays/${id}`);
  },

  // Work Schedules
  getWorkSchedules: async (date: string): Promise<WorkSchedule[]> => {
    const response = await api.get<ApiResponse<WorkSchedule[]>>(
      "/schedules/work-schedules",
      {
        params: { date },
      },
    );
    return response.data.data || [];
  },

  createWorkSchedule: async (data: {
    doctorId: string;
    shiftId: string;
    date: string;
    slotDuration?: number;
    maxPatientPerSlot?: number;
  }): Promise<WorkSchedule> => {
    const response = await api.post<ApiResponse<WorkSchedule>>(
      "/schedules/work-schedules",
      data,
    );
    return response.data.data!;
  },

  deleteWorkSchedule: async (id: string): Promise<void> => {
    await api.delete(`/schedules/work-schedules/${id}`);
  },

  // Leave Requests
  getLeaveRequests: async (status?: string): Promise<LeaveRequest[]> => {
    const response = await api.get<ApiResponse<LeaveRequest[]>>(
      "/schedules/leave-requests",
      {
        params: { status },
      },
    );
    return response.data.data || [];
  },

  reviewLeaveRequest: async (
    id: string,
    data: {
      status: "approved" | "rejected";
      reviewNote?: string;
    },
  ): Promise<LeaveRequest> => {
    const response = await api.put<ApiResponse<LeaveRequest>>(
      `/schedules/leave-requests/${id}/review`,
      data,
    );
    return response.data.data!;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>("/admin/users");
    return response.data.data || [];
  },

  createUser: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: string;
  }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>("/admin/users", data);
    return response.data.data!;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(
      `/admin/users/${id}`,
      data,
    );
    return response.data.data!;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // Utilities
  migrateDoctors: async (): Promise<void> => {
    await api.post<ApiResponse<void>>("/admin/migrate-doctors");
  },

  checkDatabase: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>("/admin/check-database");
    return response.data.data;
  },

  createDefaultSpecialty: async (): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(
      "/admin/create-default-specialty",
    );
    return response.data.data;
  },
};
