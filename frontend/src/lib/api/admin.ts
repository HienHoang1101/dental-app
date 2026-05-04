import axios from "./axios";
import type {
  DashboardStats,
  KnowledgeBaseDocument,
  ChatHistoryItem,
} from "@/types/admin";
import type { DoctorAppointment } from "@/types/doctor";
import type { Patient } from "@/types/patient";
import type { DoctorProfile, DoctorSchedule } from "@/types/doctor";
import type { Service } from "@/types/booking";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axios.get(`${API_BASE}/dashboard/stats`);
    // Transform backend response to match frontend interface
    const data = response.data.data;
    return {
      totalAppointments: data.totalAppointments || 0,
      pendingAppointments: data.appointmentsByStatus?.pending || 0,
      confirmedAppointments: data.appointmentsByStatus?.confirmed || 0,
      totalPatients: data.totalPatients || 0,
      todayAppointments:
        data.recentAppointments?.filter((apt: any) => {
          const today = new Date().toISOString().split("T")[0];
          return apt.appointmentDate === today;
        }).length || 0,
    };
  },

  // Appointments Management
  getAllAppointments: async (params?: {
    date?: string;
    status?: string;
    doctorId?: string;
  }): Promise<DoctorAppointment[]> => {
    const response = await axios.get(`${API_BASE}/api/admin/appointments`, {
      params,
    });
    return response.data;
  },

  getAppointmentDetail: async (id: string): Promise<DoctorAppointment> => {
    const response = await axios.get(
      `${API_BASE}/api/admin/appointments/${id}`,
    );
    return response.data;
  },

  confirmAppointment: async (id: string, note?: string): Promise<void> => {
    await axios.post(`${API_BASE}/api/admin/appointments/${id}/confirm`, {
      note,
    });
  },

  cancelAppointment: async (id: string, reason: string): Promise<void> => {
    await axios.post(`${API_BASE}/api/admin/appointments/${id}/cancel`, {
      reason,
    });
  },

  rescheduleAppointment: async (
    id: string,
    newScheduleId: string,
  ): Promise<void> => {
    await axios.post(`${API_BASE}/api/admin/appointments/${id}/reschedule`, {
      newScheduleId,
    });
  },

  // Patients Management
  getAllPatients: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ patients: Patient[]; total: number }> => {
    const response = await axios.get(`${API_BASE}/admin/patients`, {
      params,
    });
    return response.data.data;
  },

  getPatientDetail: async (id: string): Promise<Patient> => {
    const response = await axios.get(`${API_BASE}/api/admin/patients/${id}`);
    return response.data;
  },

  getPatientAppointments: async (
    patientId: string,
  ): Promise<DoctorAppointment[]> => {
    const response = await axios.get(
      `${API_BASE}/api/admin/patients/${patientId}/appointments`,
    );
    return response.data;
  },

  getPatientChatHistory: async (
    patientId: string,
  ): Promise<ChatHistoryItem[]> => {
    const response = await axios.get(
      `${API_BASE}/api/admin/patients/${patientId}/chat-history`,
    );
    return response.data;
  },

  // Doctors Management
  getAllDoctors: async (): Promise<DoctorProfile[]> => {
    const response = await axios.get(`${API_BASE}/admin/doctors`);
    return response.data.data;
  },

  getDoctorDetail: async (id: string): Promise<DoctorProfile> => {
    const response = await axios.get(`${API_BASE}/api/admin/doctors/${id}`);
    return response.data;
  },

  createDoctor: async (
    data: Partial<DoctorProfile>,
  ): Promise<DoctorProfile> => {
    const response = await axios.post(`${API_BASE}/api/admin/doctors`, data);
    return response.data;
  },

  updateDoctor: async (
    id: string,
    data: Partial<DoctorProfile>,
  ): Promise<DoctorProfile> => {
    const response = await axios.put(
      `${API_BASE}/api/admin/doctors/${id}`,
      data,
    );
    return response.data;
  },

  toggleDoctorStatus: async (id: string): Promise<void> => {
    await axios.patch(`${API_BASE}/api/admin/doctors/${id}/toggle-status`);
  },

  // Doctor Schedules Management
  getDoctorSchedules: async (
    doctorId: string,
    date?: string,
  ): Promise<DoctorSchedule[]> => {
    const response = await axios.get(
      `${API_BASE}/api/admin/doctors/${doctorId}/schedules`,
      { params: { date } },
    );
    return response.data;
  },

  createDoctorSchedule: async (
    doctorId: string,
    data: {
      workDate: string;
      slotStart: string;
      slotEnd: string;
    },
  ): Promise<DoctorSchedule> => {
    const response = await axios.post(
      `${API_BASE}/api/admin/doctors/${doctorId}/schedules`,
      data,
    );
    return response.data;
  },

  createBulkSchedules: async (
    doctorId: string,
    data: {
      workDate: string;
      startTime: string;
      endTime: string;
      slotDuration: number; // minutes
    },
  ): Promise<DoctorSchedule[]> => {
    const response = await axios.post(
      `${API_BASE}/api/admin/doctors/${doctorId}/schedules/bulk`,
      data,
    );
    return response.data;
  },

  deleteSchedule: async (scheduleId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/api/admin/schedules/${scheduleId}`);
  },

  // Services Management
  getAllServices: async (): Promise<Service[]> => {
    const response = await axios.get(`${API_BASE}/api/admin/services`);
    return response.data;
  },

  createService: async (data: Partial<Service>): Promise<Service> => {
    const response = await axios.post(`${API_BASE}/api/admin/services`, data);
    return response.data;
  },

  updateService: async (
    id: string,
    data: Partial<Service>,
  ): Promise<Service> => {
    const response = await axios.put(
      `${API_BASE}/api/admin/services/${id}`,
      data,
    );
    return response.data;
  },

  toggleServiceStatus: async (id: string): Promise<void> => {
    await axios.patch(`${API_BASE}/api/admin/services/${id}/toggle-status`);
  },

  // Knowledge Base Management
  getKnowledgeBase: async (): Promise<KnowledgeBaseDocument[]> => {
    const response = await axios.get(`${API_BASE}/api/admin/knowledge-base`);
    return response.data;
  },

  uploadKnowledgeBase: async (file: File, title: string): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    await axios.post(`${API_BASE}/api/admin/knowledge-base/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteKnowledgeBase: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/api/admin/knowledge-base/${id}`);
  },

  // Chat History
  getAllChatHistory: async (params?: {
    patientId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ChatHistoryItem[]> => {
    const response = await axios.get(`${API_BASE}/api/admin/chat-history`, {
      params,
    });
    return response.data;
  },
};
