package com.nhom2.appointment

import com.nhom2.common.*
import com.nhom2.models.*
import com.nhom2.doctors.SupabaseDoctorService
import com.nhom2.healthrecord.HealthRecordService
import com.nhom2.services.ServiceService
import com.nhom2.notification.NotificationService
import com.nhom2.weekschedule.WeeklyScheduleService
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.LocalTime
import java.time.Instant
import java.time.ZoneId
import java.util.UUID

object AppointmentService {
    
    /**
     * Create appointment using V2 API (time-based booking)
     */
    fun createAppointmentV2(patientId: UUID, request: CreateAppointmentRequestV2): Result<AppointmentDTOV2> {
        return transaction {
            // Validate health record exists
            val healthRecord = HealthRecordService.getHealthRecordByUserId(patientId)
                ?: return@transaction Result.failure(Exception("Health record not found. Please create one first."))

            // Validate service exists
            val service = ServiceService.getServiceById(UUID.fromString(request.serviceId))
                ?: return@transaction Result.failure(Exception("Service not found"))

            // Parse timestamps
            val startTime = try {
                Instant.parse(request.startTime)
            } catch (e: Exception) {
                return@transaction Result.failure(Exception("Invalid start time format. Use ISO 8601 format"))
            }
            
            val endTime = try {
                Instant.parse(request.endTime)
            } catch (e: Exception) {
                return@transaction Result.failure(Exception("Invalid end time format. Use ISO 8601 format"))
            }
            
            val doctorId = UUID.fromString(request.doctorId)
            
            // Validate time slot availability
            val validationResult = WeeklyScheduleService.validateSlot(doctorId, startTime, endTime)
            if (validationResult.isFailure) {
                return@transaction Result.failure(validationResult.exceptionOrNull()!!)
            }
            
            // Check for overlapping appointments
            val hasOverlap = Appointments.select {
                (Appointments.doctorId eq doctorId) and
                (Appointments.status inList listOf("pending", "confirmed")) and
                (Appointments.startTime.isNotNull()) and
                (Appointments.endTime.isNotNull()) and
                (Appointments.startTime less endTime) and
                (Appointments.endTime greater startTime)
            }.count() > 0
            
            if (hasOverlap) {
                return@transaction Result.failure(Exception("Time slot overlaps with an existing appointment"))
            }
            
            // Validate parent appointment if this is a follow-up
            if (request.parentAppointmentId != null) {
                val parentId = UUID.fromString(request.parentAppointmentId)
                val parent = Appointments.select { Appointments.id eq parentId }
                    .singleOrNull()
                    ?: return@transaction Result.failure(Exception("Parent appointment not found"))
                
                if (parent[Appointments.status] !in listOf("confirmed", "completed")) {
                    return@transaction Result.failure(Exception("Parent appointment must be confirmed or completed"))
                }
                
                // Check if follow-up is within 30 days
                val parentEndTime = parent[Appointments.endTime]
                    ?: return@transaction Result.failure(Exception("Parent appointment has no end time"))
                
                val daysDiff = java.time.Duration.between(parentEndTime, startTime).toDays()
                if (daysDiff > 30) {
                    return@transaction Result.failure(Exception("Follow-up must be within 30 days of original appointment"))
                }
            }
            
            val appointmentDate = LocalDate.ofInstant(startTime, ZoneId.of("Asia/Ho_Chi_Minh"))
            
            // Validate appointment date (not a holiday)
            val isHoliday = Holidays.select { Holidays.date eq appointmentDate }.count() > 0
            if (isHoliday) {
                return@transaction Result.failure(Exception("Cannot book appointment on holiday"))
            }

            // Create appointment
            val id = Appointments.insert {
                it[Appointments.patientId] = patientId
                it[Appointments.doctorId] = doctorId
                it[Appointments.healthRecordId] = UUID.fromString(healthRecord.id)
                it[Appointments.serviceId] = UUID.fromString(request.serviceId)
                it[Appointments.appointmentDate] = appointmentDate
                it[Appointments.startTime] = startTime
                it[Appointments.endTime] = endTime
                it[Appointments.parentAppointmentId] = request.parentAppointmentId?.let { UUID.fromString(it) }
                it[Appointments.chatSessionId] = request.chatSessionId?.let { UUID.fromString(it) }
                it[status] = "pending"
                it[notes] = request.notes
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Appointments.id

            // Notify doctor
            val doctorUserId = SupabaseDoctors.select { SupabaseDoctors.id eq doctorId }
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

            Result.success(getAppointmentByIdV2(id)!!)
        }
    }
    
    /**
     * Create follow-up appointment (doctor only)
     */
    fun createFollowUp(doctorId: UUID, request: CreateFollowUpRequest): Result<AppointmentDTOV2> {
        return transaction {
            // Get parent appointment
            val parentId = UUID.fromString(request.parentAppointmentId)
            val parent = Appointments.select { Appointments.id eq parentId }
                .singleOrNull()
                ?: return@transaction Result.failure(Exception("Parent appointment not found"))
            
            // Verify doctor owns the parent appointment
            if (parent[Appointments.doctorId] != doctorId) {
                return@transaction Result.failure(Exception("You can only create follow-ups for your own appointments"))
            }
            
            // Verify parent is confirmed
            val currentStatus = parent[Appointments.status]
            if (currentStatus != "confirmed") {
                return@transaction Result.failure(Exception("Parent appointment must be confirmed to create a follow-up"))
            }
            
            val patientId = parent[Appointments.patientId]
            val serviceId = parent[Appointments.serviceId]
            
            // Parse timestamps
            val startTime = try {
                Instant.parse(request.startTime)
            } catch (e: Exception) {
                return@transaction Result.failure(Exception("Invalid start time format"))
            }
            
            val endTime = try {
                Instant.parse(request.endTime)
            } catch (e: Exception) {
                return@transaction Result.failure(Exception("Invalid end time format"))
            }
            
            // Check if follow-up is within 30 days
            val parentEndTime = parent[Appointments.endTime]
                ?: return@transaction Result.failure(Exception("Parent appointment has no end time"))
            
            val daysDiff = java.time.Duration.between(parentEndTime, startTime).toDays()
            if (daysDiff > 30) {
                return@transaction Result.failure(Exception("Follow-up must be within 30 days of original appointment"))
            }

            // Check if start time is in the future relative to parent end time
            if (startTime.isBefore(parentEndTime)) {
                return@transaction Result.failure(Exception("Follow-up must be scheduled after the current appointment"))
            }

            if (endTime.isBefore(startTime) || endTime == startTime) {
                return@transaction Result.failure(Exception("End time must be after start time"))
            }
            
            // Check for overlapping appointments
            val hasOverlap = Appointments.select {
                (Appointments.doctorId eq doctorId) and
                (Appointments.status inList listOf("pending", "confirmed")) and
                (Appointments.startTime.isNotNull()) and
                (Appointments.endTime.isNotNull()) and
                (Appointments.startTime less endTime) and
                (Appointments.endTime greater startTime)
            }.count() > 0
            
            if (hasOverlap) {
                return@transaction Result.failure(Exception("Time slot overlaps with an existing appointment"))
            }
            
            val appointmentDate = LocalDate.ofInstant(startTime, ZoneId.of("Asia/Ho_Chi_Minh"))
            val healthRecordId = parent[Appointments.healthRecordId]
            
            // Auto-complete parent
            Appointments.update({ Appointments.id eq parentId }) {
                it[status] = "completed"
                it[notes] = (parent[Appointments.notes] ?: "") + "\n[Tái khám đã được hẹn vào $appointmentDate]"
                it[updatedAt] = Instant.now()
            }
            
            // Create follow-up appointment
            val id = Appointments.insert {
                it[Appointments.patientId] = patientId
                it[Appointments.doctorId] = doctorId
                it[Appointments.healthRecordId] = healthRecordId
                it[Appointments.serviceId] = serviceId
                it[Appointments.appointmentDate] = appointmentDate
                it[Appointments.startTime] = startTime
                it[Appointments.endTime] = endTime
                it[Appointments.parentAppointmentId] = parentId
                it[status] = "confirmed" // Follow-ups are auto-confirmed
                it[notes] = request.notes
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Appointments.id
            
            // Notify patient
            NotificationService.createNotification(CreateNotificationRequest(
                userId = patientId.toString(),
                title = "Follow-up Appointment Scheduled",
                message = "Your doctor has scheduled a follow-up appointment",
                type = "followup_scheduled",
                relatedId = id.toString()
            ))
            
            Result.success(getAppointmentByIdV2(id)!!)
        }
    }
    
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
            
            // VALIDATE WORKING HOURS: Only allow morning (8:00-12:00) and afternoon (13:30-17:30)
            val isValidMorningShift = shiftStartTime >= LocalTime.of(8, 0) && shiftEndTime <= LocalTime.of(12, 0)
            val isValidAfternoonShift = shiftStartTime >= LocalTime.of(13, 30) && shiftEndTime <= LocalTime.of(17, 30)
            
            if (!isValidMorningShift && !isValidAfternoonShift) {
                return@transaction Result.failure(Exception(
                    "Invalid appointment time. Appointments are only available during working hours: " +
                    "Morning (08:00-12:00) and Afternoon (13:30-17:30). " +
                    "Requested time slot: $shiftStartTime-$shiftEndTime"
                ))
            }
            
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
            val patientAlias = Users.alias("patient_users")
            val join = Appointments
                .innerJoin(patientAlias, { patientId }, { patientAlias[Users.id] })
                .innerJoin(SupabaseDoctors, { Appointments.doctorId }, { SupabaseDoctors.id })
                .innerJoin(HealthRecords, { Appointments.healthRecordId }, { HealthRecords.id })
                .leftJoin(TimeSlots)
                .leftJoin(Services)

            join.select { Appointments.id eq id }
                .map { it.toAppointmentDTOJoined(patientAlias) }
                .singleOrNull()
        }
    }
    
    fun getAppointmentByIdV2(id: UUID): AppointmentDTOV2? {
        return transaction {
            val patientAlias = Users.alias("patient_users")
            val join = Appointments
                .innerJoin(patientAlias, { patientId }, { patientAlias[Users.id] })
                .innerJoin(SupabaseDoctors, { Appointments.doctorId }, { SupabaseDoctors.id })
                .innerJoin(HealthRecords, { Appointments.healthRecordId }, { HealthRecords.id })
                .leftJoin(Services)

            join.select { Appointments.id eq id }
                .map { it.toAppointmentDTOV2Joined(patientAlias) }
                .singleOrNull()
        }
    }

    fun getAppointmentsByPatient(patientId: UUID, status: String? = null): List<AppointmentDTO> {
        return transaction {
            val patientAlias = Users.alias("patient_users")
            val join = Appointments
                .innerJoin(patientAlias, { Appointments.patientId }, { patientAlias[Users.id] })
                .innerJoin(SupabaseDoctors, { Appointments.doctorId }, { SupabaseDoctors.id })
                .innerJoin(HealthRecords, { Appointments.healthRecordId }, { HealthRecords.id })
                .leftJoin(TimeSlots)
                .leftJoin(Services)

            var query = join.select { Appointments.patientId eq patientId }
            
            status?.let {
                query = query.andWhere { Appointments.status eq it }
            }

            query.orderBy(Appointments.appointmentDate to SortOrder.DESC)
                .map { it.toAppointmentDTOJoined(patientAlias) }
        }
    }

    fun getAppointmentsByDoctor(doctorId: UUID, status: String? = null): List<AppointmentDTO> {
        return transaction {
            val patientAlias = Users.alias("patient_users")
            val join = Appointments
                .innerJoin(patientAlias, { Appointments.patientId }, { patientAlias[Users.id] })
                .innerJoin(SupabaseDoctors, { Appointments.doctorId }, { SupabaseDoctors.id })
                .innerJoin(HealthRecords, { Appointments.healthRecordId }, { HealthRecords.id })
                .leftJoin(TimeSlots)
                .leftJoin(Services)

            var query = join.select { Appointments.doctorId eq doctorId }
            
            status?.let {
                query = query.andWhere { Appointments.status eq it }
            }

            query.orderBy(Appointments.appointmentDate to SortOrder.ASC)
                .map { it.toAppointmentDTOJoined(patientAlias) }
        }
    }

    fun getAllAppointments(filter: AppointmentFilterRequest): PaginatedResponse<AppointmentDTO> {
        return transaction {
            val patientAlias = Users.alias("patient_users")
            val join = Appointments
                .innerJoin(patientAlias, { Appointments.patientId }, { patientAlias[Users.id] })
                .innerJoin(SupabaseDoctors, { Appointments.doctorId }, { SupabaseDoctors.id })
                .innerJoin(HealthRecords, { Appointments.healthRecordId }, { HealthRecords.id })
                .leftJoin(TimeSlots)
                .leftJoin(Services)

            var query = join.selectAll()

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
                .map { it.toAppointmentDTOJoined(patientAlias) }

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

    private fun calculateMedicationTotal(appointmentId: UUID): Int {
        return Prescriptions
            .innerJoin(PrescriptionItems)
            .innerJoin(Medications)
            .select { Prescriptions.appointmentId eq appointmentId }
            .sumOf { row ->
                val unitPrice = row[PrescriptionItems.unitPrice].takeIf { it > 0 }
                    ?: row[Medications.price]
                unitPrice * row[PrescriptionItems.quantity]
            }
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
        val timeSlot = timeSlotId?.let { 
            TimeSlots.select { TimeSlots.id eq it }.singleOrNull()?.toTimeSlotDTO() 
        }
        val service = serviceId?.let { ServiceService.getServiceById(it) }

        return AppointmentDTO(
            id = this[Appointments.id].toString(),
            patient = patient,
            doctor = doctor,
            healthRecord = healthRecord,
            timeSlot = timeSlot ?: TimeSlotDTO(
                id = "",
                workScheduleId = "",
                startTime = this[Appointments.startTime]?.toString() ?: "",
                endTime = this[Appointments.endTime]?.toString() ?: "",
                maxPatientPerSlot = 1,
                currentBookings = 0,
                remainingCapacity = 1,
                isAvailable = false,
                createdAt = ""
            ),
            service = service,
            appointmentDate = this[Appointments.appointmentDate].toString(),
            status = this[Appointments.status],
            notes = this[Appointments.notes],
            cancellationReason = this[Appointments.cancellationReason],
            totalAmount = (service?.price?.toIntOrNull() ?: 0) + calculateMedicationTotal(this[Appointments.id]),
            createdAt = this[Appointments.createdAt].toString(),
            updatedAt = this[Appointments.updatedAt].toString()
        )
    }
    
    private fun ResultRow.toAppointmentDTOV2(): AppointmentDTOV2 {
        val patientId = this[Appointments.patientId]
        val doctorId = this[Appointments.doctorId]
        val healthRecordId = this[Appointments.healthRecordId]
        val serviceId = this[Appointments.serviceId]

        val patient = Users.select { Users.id eq patientId }.single().toUserDTO()
        val doctor = SupabaseDoctorService.getDoctorSummary(doctorId)!!
        val healthRecord = HealthRecordService.getHealthRecordById(healthRecordId)!!
        val service = serviceId?.let { ServiceService.getServiceById(it) }

        return AppointmentDTOV2(
            id = this[Appointments.id].toString(),
            patient = patient,
            doctor = doctor,
            healthRecord = healthRecord,
            service = service,
            startTime = this[Appointments.startTime]?.toString(),
            endTime = this[Appointments.endTime]?.toString(),
            appointmentDate = this[Appointments.appointmentDate].toString(),
            status = this[Appointments.status],
            notes = this[Appointments.notes],
            cancellationReason = this[Appointments.cancellationReason],
            totalAmount = (service?.price?.toIntOrNull() ?: 0) + calculateMedicationTotal(this[Appointments.id]),
            parentAppointmentId = this[Appointments.parentAppointmentId]?.toString(),
            isFollowUp = this[Appointments.parentAppointmentId] != null,
            createdAt = this[Appointments.createdAt].toString(),
            updatedAt = this[Appointments.updatedAt].toString()
        )
    }

    private fun ResultRow.toAppointmentDTOJoined(patientAlias: Alias<Users>): AppointmentDTO {
        val patient = UserDTO(
            id = this[patientAlias[Users.id]].toString(),
            email = this[patientAlias[Users.email]],
            fullName = this[patientAlias[Users.fullName]],
            phone = this[patientAlias[Users.phone]],
            role = this[patientAlias[Users.role]],
            isActive = this[patientAlias[Users.isActive]],
            createdAt = this[patientAlias[Users.createdAt]].toString(),
            updatedAt = this[patientAlias[Users.updatedAt]].toString()
        )

        val doctorSummary = DoctorSummaryDTO(
            id = this[SupabaseDoctors.id].toString(),
            fullName = this[SupabaseDoctors.fullName],
            specialtyName = this[SupabaseDoctors.specialty],
            avatar = this[SupabaseDoctors.avatarUrl],
            qualifications = this[SupabaseDoctors.degree]
        )

        val healthRecordDTO = HealthRecordDTO(
            id = this[HealthRecords.id].toString(),
            userId = this[HealthRecords.userId].toString(),
            fullName = this[HealthRecords.fullName],
            dateOfBirth = this[HealthRecords.dateOfBirth].toString(),
            ethnicity = this[HealthRecords.ethnicity],
            gender = this[HealthRecords.gender],
            occupation = this[HealthRecords.occupation],
            phone = this[HealthRecords.phone],
            email = this[HealthRecords.email],
            nationalId = this[HealthRecords.nationalId],
            address = this[HealthRecords.address],
            allergyNotes = this[HealthRecords.allergyNotes],
            medicalHistory = this[HealthRecords.medicalHistory],
            dentalStatus = this[HealthRecords.dentalStatus],
            createdAt = this[HealthRecords.createdAt].toString(),
            updatedAt = this[HealthRecords.updatedAt].toString()
        )

        val timeSlotDTO = if (this.getOrNull(TimeSlots.id) != null) {
            TimeSlotDTO(
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
        } else {
            TimeSlotDTO(
                id = "",
                workScheduleId = "",
                startTime = this[Appointments.startTime]?.toString() ?: "",
                endTime = this[Appointments.endTime]?.toString() ?: "",
                maxPatientPerSlot = 1,
                currentBookings = 0,
                remainingCapacity = 1,
                isAvailable = false,
                createdAt = ""
            )
        }

        val service = if (this.getOrNull(Services.id) != null) {
            ServiceDTO(
                id = this[Services.id].toString(),
                name = this[Services.name],
                description = this[Services.description],
                price = this[Services.price].toString(),
                duration = this[Services.duration],
                category = this[Services.category],
                specialtyId = this[Services.specialtyId]?.toString(),
                isActive = this[Services.isActive],
                createdAt = this[Services.createdAt].toString(),
                updatedAt = null
            )
        } else null

        return AppointmentDTO(
            id = this[Appointments.id].toString(),
            patient = patient,
            doctor = doctorSummary,
            healthRecord = healthRecordDTO,
            timeSlot = timeSlotDTO,
            service = service,
            appointmentDate = this[Appointments.appointmentDate].toString(),
            status = this[Appointments.status],
            notes = this[Appointments.notes],
            cancellationReason = this[Appointments.cancellationReason],
            totalAmount = (service?.price?.toIntOrNull() ?: 0) + calculateMedicationTotal(this[Appointments.id]),
            createdAt = this[Appointments.createdAt].toString(),
            updatedAt = this[Appointments.updatedAt].toString()
        )
    }

    private fun ResultRow.toAppointmentDTOV2Joined(patientAlias: Alias<Users>): AppointmentDTOV2 {
        val patient = UserDTO(
            id = this[patientAlias[Users.id]].toString(),
            email = this[patientAlias[Users.email]],
            fullName = this[patientAlias[Users.fullName]],
            phone = this[patientAlias[Users.phone]],
            role = this[patientAlias[Users.role]],
            isActive = this[patientAlias[Users.isActive]],
            createdAt = this[patientAlias[Users.createdAt]].toString(),
            updatedAt = this[patientAlias[Users.updatedAt]].toString()
        )

        val doctorSummary = DoctorSummaryDTO(
            id = this[SupabaseDoctors.id].toString(),
            fullName = this[SupabaseDoctors.fullName],
            specialtyName = this[SupabaseDoctors.specialty],
            avatar = this[SupabaseDoctors.avatarUrl],
            qualifications = this[SupabaseDoctors.degree]
        )

        val healthRecordDTO = HealthRecordDTO(
            id = this[HealthRecords.id].toString(),
            userId = this[HealthRecords.userId].toString(),
            fullName = this[HealthRecords.fullName],
            dateOfBirth = this[HealthRecords.dateOfBirth].toString(),
            ethnicity = this[HealthRecords.ethnicity],
            gender = this[HealthRecords.gender],
            occupation = this[HealthRecords.occupation],
            phone = this[HealthRecords.phone],
            email = this[HealthRecords.email],
            nationalId = this[HealthRecords.nationalId],
            address = this[HealthRecords.address],
            allergyNotes = this[HealthRecords.allergyNotes],
            medicalHistory = this[HealthRecords.medicalHistory],
            dentalStatus = this[HealthRecords.dentalStatus],
            createdAt = this[HealthRecords.createdAt].toString(),
            updatedAt = this[HealthRecords.updatedAt].toString()
        )

        val service = if (this.getOrNull(Services.id) != null) {
            ServiceDTO(
                id = this[Services.id].toString(),
                name = this[Services.name],
                description = this[Services.description],
                price = this[Services.price].toString(),
                duration = this[Services.duration],
                category = this[Services.category],
                specialtyId = this[Services.specialtyId]?.toString(),
                isActive = this[Services.isActive],
                createdAt = this[Services.createdAt].toString(),
                updatedAt = null
            )
        } else null

        return AppointmentDTOV2(
            id = this[Appointments.id].toString(),
            patient = patient,
            doctor = doctorSummary,
            healthRecord = healthRecordDTO,
            service = service,
            startTime = this[Appointments.startTime]?.toString(),
            endTime = this[Appointments.endTime]?.toString(),
            appointmentDate = this[Appointments.appointmentDate].toString(),
            status = this[Appointments.status],
            notes = this[Appointments.notes],
            cancellationReason = this[Appointments.cancellationReason],
            parentAppointmentId = this[Appointments.parentAppointmentId]?.toString(),
            isFollowUp = this[Appointments.parentAppointmentId] != null,
            totalAmount = (service?.price?.toIntOrNull() ?: 0) + calculateMedicationTotal(this[Appointments.id]),
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
