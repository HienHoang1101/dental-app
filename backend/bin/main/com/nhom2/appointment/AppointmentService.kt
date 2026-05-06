package com.nhom2.appointment

import com.nhom2.common.*
import com.nhom2.models.*
import com.nhom2.doctors.SupabaseDoctorService
import com.nhom2.healthrecord.HealthRecordService
import com.nhom2.services.ServiceService
import com.nhom2.notification.NotificationService
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.Instant
import java.util.UUID

object AppointmentService {
    
    fun createAppointment(patientId: UUID, request: CreateAppointmentRequest): Result<AppointmentDTO> {
        return transaction {
            // Validate health record exists
            val healthRecord = HealthRecordService.getHealthRecordByUserId(patientId)
                ?: return@transaction Result.failure(Exception("Health record not found. Please create one first."))

            // Validate service exists
            val service = ServiceService.getServiceById(UUID.fromString(request.serviceId))
                ?: return@transaction Result.failure(Exception("Service not found"))

            // Validate time slot availability
            val timeSlot = TimeSlots.select { TimeSlots.id eq UUID.fromString(request.timeSlotId) }
                .singleOrNull() ?: return@transaction Result.failure(Exception("Time slot not found"))

            val maxPatients = timeSlot[TimeSlots.maxPatientPerSlot]
            val currentBookings = Appointments.select {
                (Appointments.timeSlotId eq UUID.fromString(request.timeSlotId)) and
                (Appointments.status inList listOf("pending", "confirmed"))
            }.count()

            if (currentBookings >= maxPatients) {
                return@transaction Result.failure(Exception("Time slot is fully booked"))
            }

            // Get work_schedule_id from time_slot
            val workScheduleId = timeSlot[TimeSlots.workScheduleId]
            
            // Get work_schedule to find doctor_id, shift_id, and date
            val workSchedule = WorkSchedules.select { WorkSchedules.id eq workScheduleId }
                .singleOrNull() ?: return@transaction Result.failure(Exception("Work schedule not found"))
            
            val doctorIdFromSchedule = workSchedule[WorkSchedules.doctorId]
            val shiftId = workSchedule[WorkSchedules.shiftId]
            val scheduleDate = workSchedule[WorkSchedules.date]
            
            // Find or create corresponding doctor_schedule
            // Note: doctor_schedules is a legacy table, we need to find the matching one
            // based on doctor, date, and time range that overlaps with the shift
            val shift = Shifts.select { Shifts.id eq shiftId }.singleOrNull()
                ?: return@transaction Result.failure(Exception("Shift not found"))
            
            val shiftStartTime = shift[Shifts.startTime]
            val shiftEndTime = shift[Shifts.endTime]
            
            // Find doctor_schedule that matches doctor, date, and overlaps with shift time
            val doctorSchedule = DoctorSchedules.select {
                (DoctorSchedules.doctorId eq doctorIdFromSchedule) and
                (DoctorSchedules.workDate eq scheduleDate) and
                (DoctorSchedules.slotStart eq shiftStartTime)
            }.singleOrNull()
            
            val scheduleId = if (doctorSchedule != null) {
                doctorSchedule[DoctorSchedules.id]
            } else {
                // Create a new doctor_schedule entry if not exists
                DoctorSchedules.insert {
                    it[doctorId] = doctorIdFromSchedule
                    it[workDate] = scheduleDate
                    it[slotStart] = shiftStartTime
                    it[slotEnd] = shiftEndTime
                    it[isBooked] = false
                    it[createdAt] = Instant.now()
                } get DoctorSchedules.id
            }

            // Validate appointment date
            val appointmentDate = LocalDate.parse(request.appointmentDate)
            val isHoliday = Holidays.select { Holidays.date eq appointmentDate }.count() > 0
            if (isHoliday) {
                return@transaction Result.failure(Exception("Cannot book appointment on holiday"))
            }

            // Create appointment
            val id = Appointments.insert {
                it[Appointments.patientId] = patientId
                it[Appointments.doctorId] = UUID.fromString(request.doctorId)
                it[Appointments.healthRecordId] = UUID.fromString(healthRecord.id)
                it[Appointments.scheduleId] = scheduleId
                it[Appointments.timeSlotId] = UUID.fromString(request.timeSlotId)
                it[Appointments.serviceId] = UUID.fromString(request.serviceId)
                it[Appointments.appointmentDate] = appointmentDate
                it[status] = "pending"
                it[notes] = request.notes
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Appointments.id

            // Notify doctor
            val doctorUserId = SupabaseDoctors.select { SupabaseDoctors.id eq UUID.fromString(request.doctorId) }
                .singleOrNull()?.get(SupabaseDoctors.userId)
            
            if (doctorUserId != null) {
                NotificationService.createNotification(CreateNotificationRequest(
                    userId = doctorUserId.toString(),
                    title = "New Appointment",
                    message = "You have a new appointment request",
                    type = "new_appointment",
                    relatedId = id.toString()
                ))
            }

            Result.success(getAppointmentById(id)!!)
        }
    }

    fun getAppointmentById(id: UUID): AppointmentDTO? {
        return transaction {
            val appointment = Appointments.select { Appointments.id eq id }
                .singleOrNull() ?: return@transaction null

            appointment.toAppointmentDTO()
        }
    }

    fun getAppointmentsByPatient(patientId: UUID, status: String? = null): List<AppointmentDTO> {
        return transaction {
            var query = Appointments.select { Appointments.patientId eq patientId }
            
            status?.let {
                query = query.andWhere { Appointments.status eq it }
            }

            query.orderBy(Appointments.appointmentDate to SortOrder.DESC)
                .map { it.toAppointmentDTO() }
        }
    }

    fun getAppointmentsByDoctor(doctorId: UUID, status: String? = null): List<AppointmentDTO> {
        return transaction {
            var query = Appointments.select { Appointments.doctorId eq doctorId }
            
            status?.let {
                query = query.andWhere { Appointments.status eq it }
            }

            query.orderBy(Appointments.appointmentDate to SortOrder.ASC)
                .map { it.toAppointmentDTO() }
        }
    }

    fun getAllAppointments(filter: AppointmentFilterRequest): PaginatedResponse<AppointmentDTO> {
        return transaction {
            var query = Appointments.selectAll()

            filter.startDate?.let {
                query = query.andWhere { Appointments.appointmentDate greaterEq LocalDate.parse(it) }
            }

            filter.endDate?.let {
                query = query.andWhere { Appointments.appointmentDate lessEq LocalDate.parse(it) }
            }

            filter.doctorId?.let {
                query = query.andWhere { Appointments.doctorId eq UUID.fromString(it) }
            }

            filter.status?.let {
                query = query.andWhere { Appointments.status eq it }
            }

            val total = query.count().toInt()
            val items = query
                .orderBy(Appointments.appointmentDate to SortOrder.DESC)
                .limit(filter.pageSize, offset = ((filter.page - 1) * filter.pageSize).toLong())
                .map { it.toAppointmentDTO() }

            PaginatedResponse(
                items = items,
                total = total,
                page = filter.page,
                pageSize = filter.pageSize,
                totalPages = (total + filter.pageSize - 1) / filter.pageSize
            )
        }
    }

    fun updateAppointmentStatus(id: UUID, request: UpdateAppointmentRequest, updatedBy: UUID): AppointmentDTO? {
        return transaction {
            val appointment = Appointments.select { Appointments.id eq id }
                .singleOrNull() ?: return@transaction null

            Appointments.update({ Appointments.id eq id }) {
                request.status?.let { v -> it[status] = v }
                request.notes?.let { v -> it[notes] = v }
                request.cancellationReason?.let { v -> it[cancellationReason] = v }
                it[updatedAt] = Instant.now()
            }

            // Send notification to patient
            val patientId = appointment[Appointments.patientId]
            request.status?.let { newStatus ->
                when (newStatus) {
                    "confirmed" -> {
                        NotificationService.createNotification(CreateNotificationRequest(
                            userId = patientId.toString(),
                            title = "Appointment Confirmed",
                            message = "Your appointment has been confirmed",
                            type = "appointment_confirmed",
                            relatedId = id.toString()
                        ))
                    }
                    "cancelled" -> {
                        NotificationService.createNotification(CreateNotificationRequest(
                            userId = patientId.toString(),
                            title = "Appointment Cancelled",
                            message = "Your appointment has been cancelled. Reason: ${request.cancellationReason ?: "Not specified"}",
                            type = "appointment_cancelled",
                            relatedId = id.toString()
                        ))
                    }
                }
            }

            getAppointmentById(id)
        }
    }

    fun cancelAppointment(id: UUID, reason: String, cancelledBy: UUID): AppointmentDTO? {
        return updateAppointmentStatus(
            id,
            UpdateAppointmentRequest(status = "cancelled", cancellationReason = reason, notes = null),
            cancelledBy
        )
    }

    private fun ResultRow.toAppointmentDTO(): AppointmentDTO {
        val patientId = this[Appointments.patientId]
        val doctorId = this[Appointments.doctorId]
        val healthRecordId = this[Appointments.healthRecordId]
        val timeSlotId = this[Appointments.timeSlotId]
        val serviceId = this[Appointments.serviceId]

        val patient = Users.select { Users.id eq patientId }.single().toUserDTO()
        val doctor = SupabaseDoctorService.getDoctorSummary(doctorId)!!
        val healthRecord = HealthRecordService.getHealthRecordById(healthRecordId)!!
        val timeSlot = TimeSlots.select { TimeSlots.id eq timeSlotId }.single().toTimeSlotDTO()
        val service = serviceId?.let { ServiceService.getServiceById(it) }

        return AppointmentDTO(
            id = this[Appointments.id].toString(),
            patient = patient,
            doctor = doctor,
            healthRecord = healthRecord,
            timeSlot = timeSlot,
            service = service,
            appointmentDate = this[Appointments.appointmentDate].toString(),
            status = this[Appointments.status],
            notes = this[Appointments.notes],
            cancellationReason = this[Appointments.cancellationReason],
            createdAt = this[Appointments.createdAt].toString(),
            updatedAt = this[Appointments.updatedAt].toString()
        )
    }

    private fun ResultRow.toUserDTO() = UserDTO(
        id = this[Users.id].toString(),
        email = this[Users.email],
        fullName = this[Users.fullName],
        phone = this[Users.phone],
        role = this[Users.role],
        isActive = this[Users.isActive],
        createdAt = this[Users.createdAt].toString(),
        updatedAt = this[Users.updatedAt].toString()
    )

    private fun ResultRow.toTimeSlotDTO() = TimeSlotDTO(
        id = this[TimeSlots.id].toString(),
        workScheduleId = this[TimeSlots.workScheduleId].toString(),
        startTime = this[TimeSlots.startTime].toString(),
        endTime = this[TimeSlots.endTime].toString(),
        maxPatientPerSlot = this[TimeSlots.maxPatientPerSlot],
        currentBookings = 0,
        remainingCapacity = this[TimeSlots.maxPatientPerSlot],
        isAvailable = true,
        createdAt = this[TimeSlots.createdAt].toString()
    )
}
