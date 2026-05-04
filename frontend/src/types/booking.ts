export interface Doctor {
  id: string
  name: string
  specialization: string
  avatar?: string
  experience: number
  rating?: number
}

export interface Service {
  id: string
  name: string
  description: string
  duration: number // minutes
  price: number
}

export interface TimeSlot {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  available: boolean
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  serviceId: string
  timeSlotId: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BookingRequest {
  doctorId: string
  serviceId: string
  timeSlotId: string
  date: string
  notes?: string
}

export interface BookingResponse {
  appointment: Appointment
  message: string
}
