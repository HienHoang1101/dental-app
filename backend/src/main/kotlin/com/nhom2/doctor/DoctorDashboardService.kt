package com.nhom2.doctor

import com.nhom2.common.*
import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

object DoctorDashboardService {
    
    // Get doctor by user ID
    fun getDoctorByUserId(userId: UUID): SupabaseDoctorDTO? {
        return transaction {
            SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it.toSupabaseDoctorDTO() }
                .singleOrNull()
        }
    }
    
    // Update doctor profile
    fun updateDoctorProfile(userId: UUID, request: UpdateDoctorProfileRequest): SupabaseDoctorDTO? {
        return transaction {
            val exists = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }.count() > 0
            if (!exists) return@transaction null
            
            SupabaseDoctors.update({ SupabaseDoctors.userId eq userId }) {
                request.fullName?.let { v -> it[fullName] = v }
                request.specialty?.let { v -> it[specialty] = v }
                request.degree?.let { v -> it[degree] = v }
                request.bio?.let { v -> it[bio] = v }
                request.avatarUrl?.let { v -> it[avatarUrl] = v }
            }
            
            getDoctorByUserId(userId)
        }
    }
    
    // Get doctor's appointments with pagination
    fun getDoctorAppointments(
        userId: UUID,
        startDate: String?,
        endDate: String?,
        status: String?,
        page: Int,
        pageSize: Int
    ): PaginatedResponse<AppointmentDTO> {
        return transaction {
            // Get the doctor ID from SupabaseDoctors
            val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it[SupabaseDoctors.id] }
                .singleOrNull() ?: return@transaction PaginatedResponse(
                    items = emptyList(),
                    total = 0,
                    page = page,
                    pageSize = pageSize,
                    totalPages = 0
                )
            
            // Build query - now Appointments references SupabaseDoctors.id directly
            var query = Appointments.select { Appointments.doctorId eq doctorId }
            
            // Check for non-empty string before parsing
            if (!startDate.isNullOrBlank()) {
                val date = LocalDate.parse(startDate)
                query = query.andWhere { Appointments.appointmentDate greaterEq date }
            }
            
            if (!endDate.isNullOrBlank()) {
                val date = LocalDate.parse(endDate)
                query = query.andWhere { Appointments.appointmentDate lessEq date }
            }
            
            if (!status.isNullOrBlank()) {
                query = query.andWhere { Appointments.status eq status }
            }
            
            val total = query.count().toInt()
            val totalPages = (total + pageSize - 1) / pageSize
            
            val items = query
                .orderBy(Appointments.appointmentDate to SortOrder.DESC)
                .limit(pageSize, offset = ((page - 1) * pageSize).toLong())
                .mapNotNull { 
                    try {
                        it.toAppointmentDTO()
                    } catch (e: Exception) {
                        null
                    }
                }
            
            PaginatedResponse(
                items = items,
                total = total,
                page = page,
                pageSize = pageSize,
                totalPages = totalPages
            )
        }
    }
    
    // Get appointment by ID
    fun getAppointmentById(userId: UUID, appointmentId: UUID): AppointmentDTO? {
        return transaction {
            val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it[SupabaseDoctors.id] }
                .singleOrNull() ?: return@transaction null
            
            Appointments.select { 
                (Appointments.id eq appointmentId) and (Appointments.doctorId eq doctorId)
            }
                .mapNotNull { 
                    try {
                        it.toAppointmentDTO()
                    } catch (e: Exception) {
                        null
                    }
                }
                .singleOrNull()
        }
    }
    
    // Confirm appointment
    fun confirmAppointment(userId: UUID, appointmentId: UUID): AppointmentDTO? {
        return transaction {
            val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it[SupabaseDoctors.id] }
                .singleOrNull() ?: return@transaction null
            
            val appointment = Appointments.select { 
                (Appointments.id eq appointmentId) and (Appointments.doctorId eq doctorId)
            }.singleOrNull() ?: return@transaction null
            
            val currentStatus = appointment[Appointments.status]
            if (currentStatus != "pending") {
                throw IllegalStateException("Only pending appointments can be confirmed")
            }
            
            Appointments.update({ Appointments.id eq appointmentId }) {
                it[status] = "confirmed"
                it[updatedAt] = Instant.now()
            }
            
            getAppointmentById(userId, appointmentId)
        }
    }
    
    // Cancel appointment
    fun cancelAppointment(userId: UUID, appointmentId: UUID, reason: String): AppointmentDTO? {
        return transaction {
            val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it[SupabaseDoctors.id] }
                .singleOrNull() ?: return@transaction null
            
            val appointment = Appointments.select { 
                (Appointments.id eq appointmentId) and (Appointments.doctorId eq doctorId)
            }.singleOrNull() ?: return@transaction null
            
            val currentStatus = appointment[Appointments.status]
            if (currentStatus == "completed" || currentStatus == "cancelled") {
                throw IllegalStateException("Cannot cancel completed or already cancelled appointments")
            }
            
            Appointments.update({ Appointments.id eq appointmentId }) {
                it[status] = "cancelled"
                it[cancellationReason] = reason
                it[updatedAt] = Instant.now()
            }
            
            getAppointmentById(userId, appointmentId)
        }
    }
    
    // Get doctor's patients
    fun getDoctorPatients(userId: UUID): List<UserDTO> {
        return transaction {
            val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it[SupabaseDoctors.id] }
                .singleOrNull() ?: return@transaction emptyList()
            
            val patientIds = Appointments.slice(Appointments.patientId)
                .select { Appointments.doctorId eq doctorId }
                .withDistinct()
                .map { it[Appointments.patientId] }
            
            Users.select { Users.id inList patientIds }
                .map { it.toUserDTO() }
        }
    }
    
    // Get patient health record
    fun getPatientHealthRecord(userId: UUID, patientId: UUID): PatientHealthRecordDTO? {
        return transaction {
            val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it[SupabaseDoctors.id] }
                .singleOrNull() ?: return@transaction null
            
            val hasAppointment = Appointments.select { 
                (Appointments.doctorId eq doctorId) and (Appointments.patientId eq patientId)
            }.count() > 0
            
            if (!hasAppointment) {
                return@transaction null
            }
            
            val patient = Users.select { Users.id eq patientId }
                .map { it.toUserDTO() }
                .singleOrNull() ?: return@transaction null
            
            val profile = PatientProfiles.select { PatientProfiles.userId eq patientId }
                .map { it.toPatientProfileDTO() }
                .singleOrNull()
            
            val appointments = Appointments.select { 
                (Appointments.doctorId eq doctorId) and (Appointments.patientId eq patientId)
            }
                .orderBy(Appointments.appointmentDate to SortOrder.DESC)
                .mapNotNull { 
                    try {
                        it.toAppointmentSummaryDTO()
                    } catch (e: Exception) {
                        null
                    }
                }
            
            PatientHealthRecordDTO(
                patient = patient,
                profile = profile,
                appointments = appointments
            )
        }
    }
    
    // Get doctor's work schedules
    fun getDoctorWorkSchedules(userId: UUID, startDate: String?, endDate: String?): List<DoctorWorkScheduleDTO> {
        return transaction {
            val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .map { it[SupabaseDoctors.id] }
                .singleOrNull() ?: return@transaction emptyList()
            
            var query = DoctorSchedules.select { DoctorSchedules.doctorId eq doctorId }
            
            startDate?.let {
                val date = LocalDate.parse(it)
                query = query.andWhere { DoctorSchedules.workDate greaterEq date }
            }
            
            endDate?.let {
                val date = LocalDate.parse(it)
                query = query.andWhere { DoctorSchedules.workDate lessEq date }
            }
            
            query.orderBy(DoctorSchedules.workDate to SortOrder.ASC, DoctorSchedules.slotStart to SortOrder.ASC)
                .map { it.toDoctorWorkScheduleDTO() }
        }
    }
    
    // Register work schedule
    fun registerWorkSchedule(userId: UUID, request: RegisterWorkScheduleRequest): DoctorWorkScheduleDTO {
        return transaction {
            try {
                val doctorId = SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                    .map { it[SupabaseDoctors.id] }
                    .singleOrNull() ?: throw IllegalArgumentException("Doctor not found")
                
                val workDate = LocalDate.parse(request.date)
                val shiftId = UUID.fromString(request.shiftId)
                
                // Get shift details
                val shift = Shifts.select { Shifts.id eq shiftId }
                    .singleOrNull() ?: throw IllegalArgumentException("Shift not found")
                
                val slotStart = shift[Shifts.startTime]
                val slotEnd = shift[Shifts.endTime]
                
                // Check if work schedule already exists
                val existingWorkSchedule = WorkSchedules.select {
                    (WorkSchedules.doctorId eq doctorId) and 
                    (WorkSchedules.shiftId eq shiftId) and 
                    (WorkSchedules.date eq workDate)
                }.singleOrNull()
                
                if (existingWorkSchedule != null) {
                    throw IllegalArgumentException("Work schedule already exists for this doctor, shift, and date")
                }
                
                // Create entry in doctor_schedules
                val scheduleId = DoctorSchedules.insert {
                    it[DoctorSchedules.doctorId] = doctorId
                    it[DoctorSchedules.workDate] = workDate
                    it[DoctorSchedules.slotStart] = slotStart
                    it[DoctorSchedules.slotEnd] = slotEnd
                    it[isBooked] = false
                    it[createdAt] = Instant.now()
                } get DoctorSchedules.id
                
                // Also create a work schedule in work_schedules table for compatibility
                val workScheduleId = WorkSchedules.insert {
                    it[WorkSchedules.doctorId] = doctorId
                    it[WorkSchedules.shiftId] = shiftId
                    it[WorkSchedules.date] = workDate
                    it[WorkSchedules.slotDuration] = 30
                    it[WorkSchedules.maxPatientPerSlot] = 1
                    it[WorkSchedules.createdAt] = Instant.now()
                } get WorkSchedules.id
                
                // Generate time slots
                var currentTime = slotStart
                val slotDuration = 30 // minutes
                
                while (currentTime.plusMinutes(slotDuration.toLong()) <= slotEnd) {
                    val slotEndTime = currentTime.plusMinutes(slotDuration.toLong())
                    
                    TimeSlots.insert {
                        it[TimeSlots.workScheduleId] = workScheduleId
                        it[TimeSlots.startTime] = currentTime
                        it[TimeSlots.endTime] = slotEndTime
                        it[TimeSlots.maxPatientPerSlot] = 1
                        it[TimeSlots.createdAt] = Instant.now()
                    }
                    
                    currentTime = slotEndTime
                }
                
                DoctorSchedules.select { DoctorSchedules.id eq scheduleId }
                    .map { it.toDoctorWorkScheduleDTO() }
                    .single()
            } catch (e: Exception) {
                e.printStackTrace()
                throw e
            }
        }
    }
    
    // Get doctor's leave requests
    fun getDoctorLeaveRequests(userId: UUID): List<LeaveRequestDTO> {
        return emptyList()
    }
    
    // Create leave request
    fun createLeaveRequest(userId: UUID, request: CreateLeaveRequestRequest): LeaveRequestDTO {
        throw UnsupportedOperationException("Leave requests feature is temporarily unavailable")
    }
    
    // Extension functions
    private fun ResultRow.toSupabaseDoctorDTO(): SupabaseDoctorDTO {
        val userId = this[SupabaseDoctors.userId]
        val user = userId?.let {
            Users.select { Users.id eq it }.singleOrNull()?.toUserDTO()
        }
        
        return SupabaseDoctorDTO(
            id = this[SupabaseDoctors.id].toString(),
            userId = userId?.toString(),
            user = user,
            fullName = this[SupabaseDoctors.fullName],
            specialty = this[SupabaseDoctors.specialty],
            degree = this[SupabaseDoctors.degree],
            bio = this[SupabaseDoctors.bio],
            avatarUrl = this[SupabaseDoctors.avatarUrl],
            isActive = this[SupabaseDoctors.isActive],
            createdAt = this[SupabaseDoctors.createdAt].toString()
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
    
    private fun ResultRow.toPatientProfileDTO() = PatientProfileDTO(
        id = this[PatientProfiles.id].toString(),
        userId = this[PatientProfiles.userId].toString(),
        dateOfBirth = this[PatientProfiles.dateOfBirth]?.toString(),
        gender = this[PatientProfiles.gender],
        allergyNotes = this[PatientProfiles.allergyNotes],
        medicalHistory = this[PatientProfiles.medicalHistory],
        updatedAt = this[PatientProfiles.updatedAt].toString()
    )
    
    private fun ResultRow.toDoctorWorkScheduleDTO() = DoctorWorkScheduleDTO(
        id = this[DoctorSchedules.id].toString(),
        doctorId = this[DoctorSchedules.doctorId].toString(),
        workDate = this[DoctorSchedules.workDate].toString(),
        slotStart = this[DoctorSchedules.slotStart].toString(),
        slotEnd = this[DoctorSchedules.slotEnd].toString(),
        isBooked = this[DoctorSchedules.isBooked],
        createdAt = this[DoctorSchedules.createdAt].toString()
    )
    
    private fun ResultRow.toAppointmentDTO(): AppointmentDTO {
        val patientId = this[Appointments.patientId]
        val doctorId = this[Appointments.doctorId]
        val timeSlotId = this[Appointments.timeSlotId]
        val serviceId = this[Appointments.serviceId]
        val healthRecordId = this[Appointments.healthRecordId]
        
        val patient = Users.select { Users.id eq patientId }.single().toUserDTO()
        
        // Get doctor from SupabaseDoctors
        val supabaseDoctor = SupabaseDoctors.select { SupabaseDoctors.id eq doctorId }.single()
        
        val doctorSummary = DoctorSummaryDTO(
            id = supabaseDoctor[SupabaseDoctors.id].toString(),
            fullName = supabaseDoctor[SupabaseDoctors.fullName],
            specialtyName = supabaseDoctor[SupabaseDoctors.specialty],
            avatar = supabaseDoctor[SupabaseDoctors.avatarUrl],
            qualifications = supabaseDoctor[SupabaseDoctors.degree]
        )
        
        val timeSlot = TimeSlots.select { TimeSlots.id eq timeSlotId }.single()
        val timeSlotDTO = TimeSlotDTO(
            id = timeSlot[TimeSlots.id].toString(),
            workScheduleId = timeSlot[TimeSlots.workScheduleId].toString(),
            startTime = timeSlot[TimeSlots.startTime].toString(),
            endTime = timeSlot[TimeSlots.endTime].toString(),
            maxPatientPerSlot = timeSlot[TimeSlots.maxPatientPerSlot],
            currentBookings = 1,
            remainingCapacity = 0,
            isAvailable = false,
            createdAt = timeSlot[TimeSlots.createdAt].toString()
        )
        
        val service = serviceId?.let {
            Services.select { Services.id eq it }.singleOrNull()?.let { row ->
                ServiceDTO(
                    id = row[Services.id].toString(),
                    name = row[Services.name],
                    description = row[Services.description],
                    price = row[Services.price].toString(),
                    duration = row[Services.duration],
                    category = row[Services.category],
                    specialtyId = row[Services.specialtyId]?.toString(),
                    isActive = row[Services.isActive],
                    createdAt = row[Services.createdAt].toString(),
                    updatedAt = null
                )
            }
        }
        
        val healthRecord = HealthRecords.select { HealthRecords.id eq healthRecordId }.single()
        val healthRecordDTO = HealthRecordDTO(
            id = healthRecord[HealthRecords.id].toString(),
            userId = healthRecord[HealthRecords.userId].toString(),
            fullName = healthRecord[HealthRecords.fullName],
            dateOfBirth = healthRecord[HealthRecords.dateOfBirth].toString(),
            ethnicity = healthRecord[HealthRecords.ethnicity],
            gender = healthRecord[HealthRecords.gender],
            occupation = healthRecord[HealthRecords.occupation],
            phone = healthRecord[HealthRecords.phone],
            email = healthRecord[HealthRecords.email],
            nationalId = healthRecord[HealthRecords.nationalId],
            address = healthRecord[HealthRecords.address],
            allergyNotes = healthRecord[HealthRecords.allergyNotes],
            medicalHistory = healthRecord[HealthRecords.medicalHistory],
            dentalStatus = healthRecord[HealthRecords.dentalStatus],
            createdAt = healthRecord[HealthRecords.createdAt].toString(),
            updatedAt = healthRecord[HealthRecords.updatedAt].toString()
        )
        
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
            createdAt = this[Appointments.createdAt].toString(),
            updatedAt = this[Appointments.updatedAt].toString()
        )
    }
    
    private fun ResultRow.toAppointmentSummaryDTO(): AppointmentSummaryDTO {
        val patientId = this[Appointments.patientId]
        val doctorId = this[Appointments.doctorId]
        val timeSlotId = this[Appointments.timeSlotId]
        val serviceId = this[Appointments.serviceId]
        
        val patientName = Users.select { Users.id eq patientId }.single()[Users.fullName]
        val supabaseDoctor = SupabaseDoctors.select { SupabaseDoctors.id eq doctorId }.single()
        val timeSlot = TimeSlots.select { TimeSlots.id eq timeSlotId }.single()
        val serviceName = serviceId?.let {
            Services.select { Services.id eq it }.singleOrNull()?.get(Services.name)
        }
        
        return AppointmentSummaryDTO(
            id = this[Appointments.id].toString(),
            patientName = patientName,
            doctorName = supabaseDoctor[SupabaseDoctors.fullName],
            specialtyName = supabaseDoctor[SupabaseDoctors.specialty],
            appointmentDate = this[Appointments.appointmentDate].toString(),
            startTime = timeSlot[TimeSlots.startTime].toString(),
            endTime = timeSlot[TimeSlots.endTime].toString(),
            status = this[Appointments.status],
            serviceName = serviceName
        )
    }
}
