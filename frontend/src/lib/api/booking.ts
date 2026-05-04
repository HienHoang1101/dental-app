<<<<<<< HEAD
import apiClient from "./axios";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
=======
import apiClient from './axios'
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints'
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
import type {
  Doctor,
  Service,
  TimeSlot,
  Appointment,
  BookingRequest,
  BookingResponse,
<<<<<<< HEAD
} from "@/types/booking";
import { mockBookingApi } from "./mock-booking";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Toggle between mock and real API
const USE_MOCK_API = false; // Set to false to use real backend

export const bookingApi = USE_MOCK_API
  ? mockBookingApi
  : {
      getDoctors: async (): Promise<Doctor[]> => {
        // Get doctors from real backend
        const response = await apiClient.get(`${API_BASE}/doctors`);
        const doctors = response.data.data || [];

        // Transform to match frontend interface
        return doctors.map((doctor: any) => ({
          id: doctor.id,
          name: doctor.user?.fullName || doctor.fullName || "Unknown",
          specialization:
            doctor.specialty?.name || doctor.specialtyName || "General",
          experience: 5, // Default value
          avatar: doctor.avatar,
          bio: doctor.bio,
        }));
      },

      getServices: async (): Promise<Service[]> => {
        const response = await apiClient.get(`${API_BASE}/services`);
        const services = response.data.data || [];

        // Transform to match frontend interface
        return services.map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description || "",
          price: parseFloat(service.price) || 0,
          duration: service.duration || 30,
        }));
      },

      getTimeSlots: async (
        doctorId: string,
        date: string,
      ): Promise<TimeSlot[]> => {
        const response = await apiClient.get(
          `${API_BASE}/schedules/available-slots`,
          {
            params: { doctorId, date },
          },
        );
        const slots = response.data.data || [];

        // Transform to match frontend interface
        return slots.map((slot: any) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: slot.isAvailable !== false,
        }));
      },

      createBooking: async (data: BookingRequest): Promise<BookingResponse> => {
        const response = await apiClient.post(`${API_BASE}/appointments`, {
          doctorId: data.doctorId,
          timeSlotId: data.timeSlotId,
          serviceId: data.serviceId,
          appointmentDate: data.date,
          notes: data.notes,
        });
        return response.data.data;
      },

      getAppointments: async (): Promise<Appointment[]> => {
        const response = await apiClient.get(`${API_BASE}/appointments/my`);
        return response.data.data || [];
      },

      cancelAppointment: async (id: string, reason?: string): Promise<void> => {
        await apiClient.delete(`${API_BASE}/appointments/${id}`, {
          params: { reason },
        });
      },
    };
=======
} from '@/types/booking'
import { mockBookingApi } from './mock-booking'

// Toggle between mock and real API
const USE_MOCK_API = true // Set to false when backend is ready

export const bookingApi = USE_MOCK_API ? mockBookingApi : {
  getDoctors: async (): Promise<Doctor[]> => {
    const response = await apiClient.get(API_ENDPOINTS.BOOKING.DOCTORS)
    return response.data
  },

  getServices: async (): Promise<Service[]> => {
    const response = await apiClient.get(API_ENDPOINTS.BOOKING.SERVICES)
    return response.data
  },

  getTimeSlots: async (doctorId: string, date: string): Promise<TimeSlot[]> => {
    const response = await apiClient.get(API_ENDPOINTS.BOOKING.TIME_SLOTS, {
      params: { doctorId, date },
    })
    return response.data
  },

  createBooking: async (data: BookingRequest): Promise<BookingResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.BOOKING.CREATE, data)
    return response.data
  },

  getAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get(API_ENDPOINTS.PATIENT.APPOINTMENTS)
    return response.data
  },

  cancelAppointment: async (id: string, reason?: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.BOOKING.CANCEL(id), { reason })
  },
}
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
