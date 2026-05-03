import apiClient from './axios'
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints'
import type {
  Doctor,
  Service,
  TimeSlot,
  Appointment,
  BookingRequest,
  BookingResponse,
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
