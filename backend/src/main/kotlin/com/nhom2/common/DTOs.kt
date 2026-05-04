package com.nhom2.common

import kotlinx.serialization.Serializable
import java.time.Instant

// ── Common Response DTOs ─────────────────────────
@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
    val timestamp: String = Instant.now().toString()
)

@Serializable
data class ErrorResponse(
    val success: Boolean = false,
    val error: String,
    val message: String,
    val timestamp: String = Instant.now().toString()
)

@Serializable
data class PaginatedResponse<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pageSize: Int,
    val totalPages: Int
)

// ── User DTOs ────────────────────────────────────
@Serializable
data class UserDTO(
    val id: String,
    val email: String,
    val fullName: String,
    val phone: String?,
    val role: String,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateUserRequest(
    val email: String,
    val password: String,
    val fullName: String,
    val phone: String?,
    val role: String = "patient"
)

@Serializable
data class UpdateUserRequest(
    val fullName: String?,
    val phone: String?,
    val isActive: Boolean?
)

// ── Auth DTOs ────────────────────────────────────
@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val user: UserDTO
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val fullName: String,
    val phone: String?
)

// ── Health Record DTOs ───────────────────────────
@Serializable
data class HealthRecordDTO(
    val id: String,
    val userId: String,
    val fullName: String,
    val dateOfBirth: String,
    val ethnicity: String?,
    val gender: String,
    val occupation: String?,
    val phone: String,
    val email: String,
    val nationalId: String?,
    val address: String,
    val allergyNotes: String?,
    val medicalHistory: String?,
    val dentalStatus: String?,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateHealthRecordRequest(
    val fullName: String,
    val dateOfBirth: String,
    val ethnicity: String?,
    val gender: String,
    val occupation: String?,
    val phone: String,
    val email: String,
    val nationalId: String?,
    val address: String,
    val allergyNotes: String?,
    val medicalHistory: String?,
    val dentalStatus: String?
)

@Serializable
data class UpdateHealthRecordRequest(
    val fullName: String?,
    val dateOfBirth: String?,
    val ethnicity: String?,
    val gender: String?,
    val occupation: String?,
    val phone: String?,
    val email: String?,
    val nationalId: String?,
    val address: String?,
    val allergyNotes: String?,
    val medicalHistory: String?,
    val dentalStatus: String?
)

// ── Specialty DTOs ───────────────────────────────
@Serializable
data class SpecialtyDTO(
    val id: String,
    val name: String,
    val description: String?,
    val isActive: Boolean,
    val doctorCount: Int = 0,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateSpecialtyRequest(
    val name: String,
    val description: String?
)

@Serializable
data class UpdateSpecialtyRequest(
    val name: String?,
    val description: String?,
    val isActive: Boolean?
)

// ── Doctor DTOs ──────────────────────────────────
@Serializable
data class DoctorDTO(
    val id: String,
    val userId: String,
    val user: UserDTO,
    val specialty: SpecialtyDTO,
    val qualifications: String?,
    val bio: String?,
    val avatar: String?,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class DoctorSummaryDTO(
    val id: String,
    val fullName: String,
    val specialtyName: String,
    val avatar: String?,
    val qualifications: String?
)

@Serializable
data class CreateDoctorRequest(
    val userId: String,
    val specialtyId: String,
    val qualifications: String?,
    val bio: String?,
    val avatar: String?
)

@Serializable
data class UpdateDoctorRequest(
    val specialtyId: String?,
    val qualifications: String?,
    val bio: String?,
    val avatar: String?,
    val isActive: Boolean?
)

// ── Service DTOs ─────────────────────────────────
@Serializable
data class ServiceDTO(
    val id: String,
    val name: String,
    val description: String?,
    val price: String,
    val duration: Int,
    val category: String?,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateServiceRequest(
    val name: String,
    val description: String?,
    val price: String,
    val duration: Int,
    val category: String?
)

@Serializable
data class UpdateServiceRequest(
    val name: String?,
    val description: String?,
    val price: String?,
    val duration: Int?,
    val category: String?,
    val isActive: Boolean?
)

// ── Holiday DTOs ─────────────────────────────────
@Serializable
data class HolidayDTO(
    val id: String,
    val date: String,
    val name: String,
    val description: String?,
    val createdAt: String
)

@Serializable
data class CreateHolidayRequest(
    val date: String,
    val name: String,
    val description: String?
)

// ── Shift DTOs ───────────────────────────────────
@Serializable
data class ShiftDTO(
    val id: String,
    val name: String,
    val startTime: String,
    val endTime: String,
    val createdAt: String
)

@Serializable
data class CreateShiftRequest(
    val name: String,
    val startTime: String,
    val endTime: String
)

// ── Work Schedule DTOs ───────────────────────────
@Serializable
data class WorkScheduleDTO(
    val id: String,
    val doctor: DoctorSummaryDTO,
    val shift: ShiftDTO,
    val date: String,
    val slotDuration: Int,
    val maxPatientPerSlot: Int,
    val timeSlots: List<TimeSlotDTO>,
    val createdAt: String
)

@Serializable
data class CreateWorkScheduleRequest(
    val doctorId: String,
    val shiftId: String,
    val date: String,
    val slotDuration: Int = 30,
    val maxPatientPerSlot: Int = 1
)

// ── Time Slot DTOs ───────────────────────────────
@Serializable
data class TimeSlotDTO(
    val id: String,
    val workScheduleId: String,
    val startTime: String,
    val endTime: String,
    val maxPatientPerSlot: Int,
    val currentBookings: Int = 0,
    val remainingCapacity: Int = 0,
    val isAvailable: Boolean = true,
    val createdAt: String
)

// ── Appointment DTOs ─────────────────────────────
@Serializable
data class AppointmentDTO(
    val id: String,
    val patient: UserDTO,
    val doctor: DoctorSummaryDTO,
    val healthRecord: HealthRecordDTO,
    val timeSlot: TimeSlotDTO,
    val service: ServiceDTO?,
    val appointmentDate: String,
    val status: String,
    val notes: String?,
    val cancellationReason: String?,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class AppointmentSummaryDTO(
    val id: String,
    val patientName: String,
    val doctorName: String,
    val specialtyName: String,
    val appointmentDate: String,
    val startTime: String,
    val endTime: String,
    val status: String,
    val serviceName: String?
)

@Serializable
data class CreateAppointmentRequest(
    val doctorId: String,
    val timeSlotId: String,
    val serviceId: String?,
    val appointmentDate: String,
    val notes: String?
)

@Serializable
data class UpdateAppointmentRequest(
    val status: String?,
    val notes: String?,
    val cancellationReason: String?
)

// ── Leave Request DTOs ───────────────────────────
@Serializable
data class LeaveRequestDTO(
    val id: String,
    val doctor: DoctorSummaryDTO,
    val startDate: String,
    val endDate: String,
    val reason: String,
    val status: String,
    val reviewedBy: UserDTO?,
    val reviewedAt: String?,
    val createdAt: String
)

@Serializable
data class CreateLeaveRequestRequest(
    val startDate: String,
    val endDate: String,
    val reason: String
)

@Serializable
data class ReviewLeaveRequestRequest(
    val status: String, // approved or rejected
    val reviewNote: String?
)

// ── Notification DTOs ────────────────────────────
@Serializable
data class NotificationDTO(
    val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val type: String,
    val isRead: Boolean,
    val relatedId: String?,
    val createdAt: String
)

@Serializable
data class CreateNotificationRequest(
    val userId: String,
    val title: String,
    val message: String,
    val type: String,
    val relatedId: String?
)

// ── Dashboard DTOs ───────────────────────────────
@Serializable
data class DashboardStatsDTO(
    val totalAppointments: Int,
    val totalPatients: Int,
    val totalRevenue: String,
    val appointmentsByStatus: Map<String, Int>,
    val recentAppointments: List<AppointmentSummaryDTO>
)

// ── Filter/Search DTOs ───────────────────────────
@Serializable
data class DoctorFilterRequest(
    val specialtyId: String?,
    val weekday: String?,
    val gender: String?,
    val sessionTime: String?, // morning, afternoon, evening
    val search: String?
)

@Serializable
data class AppointmentFilterRequest(
    val startDate: String?,
    val endDate: String?,
    val doctorId: String?,
    val specialtyId: String?,
    val status: String?,
    val page: Int = 1,
    val pageSize: Int = 20
)
