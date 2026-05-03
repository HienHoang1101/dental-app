/**
 * Mock Booking API for Testing
 */

import type {
  Doctor,
  Service,
  TimeSlot,
  Appointment,
  BookingRequest,
  BookingResponse,
} from "@/types/booking";

// Mock doctors
const MOCK_DOCTORS: Doctor[] = [
  {
    id: "1",
    name: "BS. Nguyễn Văn Hùng",
    specialization: "Nha khoa tổng quát",
    experience: 10,
    rating: 4.8,
  },
  {
    id: "2",
    name: "BS. Trần Thị Mai",
    specialization: "Chỉnh nha",
    experience: 8,
    rating: 4.9,
  },
  {
    id: "3",
    name: "BS. Lê Văn Tùng",
    specialization: "Phẫu thuật hàm mặt",
    experience: 15,
    rating: 4.7,
  },
];

// Mock services
const MOCK_SERVICES: Service[] = [
  {
    id: "1",
    name: "Khám tổng quát",
    description: "Khám và tư vấn tình trạng răng miệng",
    duration: 30,
    price: 200000,
  },
  {
    id: "2",
    name: "Lấy cao răng",
    description: "Vệ sinh răng miệng, lấy cao răng",
    duration: 45,
    price: 300000,
  },
  {
    id: "3",
    name: "Trám răng",
    description: "Trám răng sâu, phục hồi răng",
    duration: 60,
    price: 500000,
  },
  {
    id: "4",
    name: "Nhổ răng",
    description: "Nhổ răng khôn, răng sữa",
    duration: 45,
    price: 400000,
  },
  {
    id: "5",
    name: "Tẩy trắng răng",
    description: "Tẩy trắng răng công nghệ Laser",
    duration: 90,
    price: 2000000,
  },
];

// Mock time slots
const generateTimeSlots = (doctorId: string, date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const times = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  times.forEach((time, index) => {
    const [hour, minute] = time.split(":");
    const endHour = String(parseInt(hour) + 1).padStart(2, "0");
    slots.push({
      id: `${doctorId}_${date}_${index}`,
      doctorId,
      date,
      startTime: time,
      endTime: `${endHour}:${minute}`,
      available: Math.random() > 0.3, // 70% available
    });
  });

  return slots;
};

// Mock appointments storage
const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    patientId: "1",
    doctorId: "1",
    serviceId: "1",
    timeSlotId: "1_2026-05-10_0",
    date: "2026-05-10",
    startTime: "08:00",
    endTime: "09:00",
    status: "confirmed",
    notes: "Đau răng hàm dưới",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    patientId: "1",
    doctorId: "2",
    serviceId: "2",
    timeSlotId: "2_2026-05-15_2",
    date: "2026-05-15",
    startTime: "10:00",
    endTime: "11:00",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockBookingApi = {
  getDoctors: async (): Promise<Doctor[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_DOCTORS;
  },

  getServices: async (): Promise<Service[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_SERVICES;
  },

  getTimeSlots: async (doctorId: string, date: string): Promise<TimeSlot[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return generateTimeSlots(doctorId, date);
  },

  createBooking: async (data: BookingRequest): Promise<BookingResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newAppointment: Appointment = {
      id: String(MOCK_APPOINTMENTS.length + 1),
      patientId: "1", // Current user
      doctorId: data.doctorId,
      serviceId: data.serviceId,
      timeSlotId: data.timeSlotId,
      date: data.date,
      startTime: "08:00", // Should get from timeSlot
      endTime: "09:00",
      status: "pending",
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_APPOINTMENTS.push(newAppointment);

    return {
      appointment: newAppointment,
      message: "Đặt lịch thành công! Email xác nhận đã được gửi.",
    };
  },

  getAppointments: async (): Promise<Appointment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_APPOINTMENTS.filter((apt) => apt.patientId === "1");
  },

  cancelAppointment: async (id: string, reason?: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const appointment = MOCK_APPOINTMENTS.find((apt) => apt.id === id);
    if (appointment) {
      appointment.status = "cancelled";
      appointment.notes = appointment.notes
        ? `${appointment.notes}\n\nLý do hủy: ${reason}`
        : `Lý do hủy: ${reason}`;
      appointment.updatedAt = new Date().toISOString();
    }
  },
};
