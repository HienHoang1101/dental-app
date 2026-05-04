import axios from "./axios";
import type {
  DoctorProfile,
  DoctorAppointment,
  DoctorDashboardStats,
  PatientChatHistory,
  UpdateAppointmentNoteRequest,
  CompleteAppointmentRequest,
} from "@/types/doctor";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const doctorApi = {
  // Get doctor profile
  getProfile: async (): Promise<DoctorProfile> => {
    const response = await axios.get(`${API_BASE}/doctor/profile`);
    return response.data.data;
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<DoctorDashboardStats> => {
    const response = await axios.get(`${API_BASE}/doctor/dashboard/stats`);
    return response.data.data;
  },

  // Get appointments
  getAppointments: async (params?: {
    date?: string;
    status?: string;
  }): Promise<DoctorAppointment[]> => {
    const response = await axios.get(`${API_BASE}/doctor/appointments`, {
      params,
    });
    return response.data.data;
  },

  // Get appointment detail
  getAppointmentDetail: async (id: string): Promise<DoctorAppointment> => {
    const response = await axios.get(`${API_BASE}/doctor/appointments/${id}`);
    return response.data.data;
  },

  // Get patient chat history
  getPatientChatHistory: async (
    patientId: string,
  ): Promise<PatientChatHistory[]> => {
    const response = await axios.get(
      `${API_BASE}/doctor/patients/${patientId}/chat-history`,
    );
    return response.data.data;
  },

  // Update appointment note
  updateAppointmentNote: async (
    appointmentId: string,
    data: UpdateAppointmentNoteRequest,
  ): Promise<void> => {
    await axios.patch(
      `${API_BASE}/doctor/appointments/${appointmentId}/note`,
      data,
    );
  },

  // Complete appointment
  completeAppointment: async (
    appointmentId: string,
    data: CompleteAppointmentRequest,
  ): Promise<void> => {
    await axios.post(
      `${API_BASE}/doctor/appointments/${appointmentId}/complete`,
      data,
    );
  },

  // Get today's schedule
  getTodaySchedule: async (): Promise<DoctorAppointment[]> => {
    const today = new Date().toISOString().split("T")[0];
    return doctorApi.getAppointments({ date: today });
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (): Promise<DoctorAppointment[]> => {
    const response = await axios.get(
      `${API_BASE}/doctor/appointments/upcoming`,
    );
    return response.data.data;
  },
};
