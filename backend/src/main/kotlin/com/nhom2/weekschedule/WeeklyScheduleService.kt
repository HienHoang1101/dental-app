package com.nhom2.weekschedule

import com.nhom2.common.*
import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.*
import java.time.format.DateTimeFormatter
import java.util.UUID

object WeeklyScheduleService {
    
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
    
    // Default session times
    private val MORNING_START = LocalTime.of(8, 0)
    private val MORNING_END = LocalTime.of(12, 0)
    private val AFTERNOON_START = LocalTime.of(13, 30)
    private val AFTERNOON_END = LocalTime.of(17, 30)
    
    private val SLOT_DURATION_HOURS = 1L
    private val LEAD_TIME_HOURS = 2L
    private val MAX_BOOKING_DAYS = 30L
    
    /**
     * Get all weekly schedules for a doctor
     */
    fun getByDoctor(doctorId: UUID): List<WeeklyScheduleDTO> {
        return transaction {
            WeeklyWorkSchedules.select { 
                WeeklyWorkSchedules.doctorId eq doctorId 
            }.orderBy(WeeklyWorkSchedules.dayOfWeek to SortOrder.ASC)
             .map { it.toWeeklyScheduleDTO() }
        }
    }
    
    /**
     * Create or update a weekly schedule
     */
    fun upsert(doctorId: UUID, request: CreateWeeklyScheduleRequest): Result<WeeklyScheduleDTO> {
        return transaction {
            // Validate day of week
            if (request.dayOfWeek !in 1..7) {
                return@transaction Result.failure(Exception("Invalid day_of_week. Must be 1-7 (1=Monday, 7=Sunday)"))
            }
            
            // Validate session
            if (request.session !in listOf("morning", "afternoon")) {
                return@transaction Result.failure(Exception("Invalid session. Must be 'morning' or 'afternoon'"))
            }
            
            // Determine start/end times
            val startTime = if (request.startTime != null) {
                LocalTime.parse(request.startTime, timeFormatter)
            } else {
                if (request.session == "morning") MORNING_START else AFTERNOON_START
            }
            
            val endTime = if (request.endTime != null) {
                LocalTime.parse(request.endTime, timeFormatter)
            } else {
                if (request.session == "morning") MORNING_END else AFTERNOON_END
            }
            
            // Validate times
            if (startTime >= endTime) {
                return@transaction Result.failure(Exception("start_time must be before end_time"))
            }
            
            // Check if schedule already exists
            val existing = WeeklyWorkSchedules.select {
                (WeeklyWorkSchedules.doctorId eq doctorId) and
                (WeeklyWorkSchedules.dayOfWeek eq request.dayOfWeek) and
                (WeeklyWorkSchedules.session eq request.session)
            }.singleOrNull()
            
            val id = if (existing != null) {
                // Update existing
                WeeklyWorkSchedules.update({
                    (WeeklyWorkSchedules.doctorId eq doctorId) and
                    (WeeklyWorkSchedules.dayOfWeek eq request.dayOfWeek) and
                    (WeeklyWorkSchedules.session eq request.session)
                }) {
                    it[WeeklyWorkSchedules.startTime] = startTime
                    it[WeeklyWorkSchedules.endTime] = endTime
                    it[isActive] = true
                    it[updatedAt] = Instant.now()
                }
                existing[WeeklyWorkSchedules.id]
            } else {
                // Insert new
                WeeklyWorkSchedules.insert {
                    it[WeeklyWorkSchedules.doctorId] = doctorId
                    it[dayOfWeek] = request.dayOfWeek
                    it[session] = request.session
                    it[WeeklyWorkSchedules.startTime] = startTime
                    it[WeeklyWorkSchedules.endTime] = endTime
                    it[isActive] = true
                    it[createdAt] = Instant.now()
                    it[updatedAt] = Instant.now()
                } get WeeklyWorkSchedules.id
            }
            
            val schedule = WeeklyWorkSchedules.select { WeeklyWorkSchedules.id eq id }
                .single()
                .toWeeklyScheduleDTO()
            
            Result.success(schedule)
        }
    }
    
    /**
     * Deactivate a weekly schedule
     */
    fun deactivate(id: UUID): Boolean {
        return transaction {
            val updated = WeeklyWorkSchedules.update({ WeeklyWorkSchedules.id eq id }) {
                it[isActive] = false
                it[updatedAt] = Instant.now()
            }
            updated > 0
        }
    }
    
    /**
     * Get available time slots for a doctor on a specific date
     * This is the core algorithm for dynamic slot generation
     */
    fun getAvailableSlots(doctorId: UUID, date: LocalDate): List<AvailableSlotDTO> {
        return transaction {
            val slots = mutableListOf<AvailableSlotDTO>()
            val now = Instant.now()
            val zoneId = ZoneId.of("UTC")
            
            // Step 1: Get day of week (1=Monday, 7=Sunday)
            val dayOfWeek = date.dayOfWeek.value
            
            // Step 2: Get weekly schedules for this day
            val weeklySchedules = WeeklyWorkSchedules.select {
                (WeeklyWorkSchedules.doctorId eq doctorId) and
                (WeeklyWorkSchedules.dayOfWeek eq dayOfWeek) and
                (WeeklyWorkSchedules.isActive eq true)
            }.toList()
            
            if (weeklySchedules.isEmpty()) {
                return@transaction emptyList()
            }
            
            // Step 3: Check if date is a holiday
            val isHoliday = Holidays.select { Holidays.date eq date }.count() > 0
            if (isHoliday) {
                return@transaction emptyList()
            }
            
            // Step 4: Get exceptions for this date
            val exceptions = ScheduleExceptions.select {
                (ScheduleExceptions.doctorId eq doctorId) and
                (ScheduleExceptions.exceptionDate eq date)
            }.associateBy { it[ScheduleExceptions.session] }
            
            // Step 4.5: Check for approved leave requests
            val hasApprovedLeave = LeaveRequests.select {
                (LeaveRequests.doctorId eq doctorId) and
                (LeaveRequests.status eq "approved") and
                (LeaveRequests.startDate lessEq date) and
                (LeaveRequests.endDate greaterEq date)
            }.count() > 0
            
            if (hasApprovedLeave) {
                return@transaction emptyList()
            }
            
            // Step 5: Process each session
            for (schedule in weeklySchedules) {
                val session = schedule[WeeklyWorkSchedules.session]
                val exception = exceptions[session] ?: exceptions[null] // Check session-specific or full-day exception
                
                // Check if this session is off
                if (exception != null && exception[ScheduleExceptions.exceptionType] == "off") {
                    continue // Skip this session
                }
                
                // Determine working hours for this session
                val startTime = if (exception != null && exception[ScheduleExceptions.exceptionType] == "override") {
                    exception[ScheduleExceptions.overrideStartTime]!!
                } else {
                    schedule[WeeklyWorkSchedules.startTime]
                }
                
                val endTime = if (exception != null && exception[ScheduleExceptions.exceptionType] == "override") {
                    exception[ScheduleExceptions.overrideEndTime]!!
                } else {
                    schedule[WeeklyWorkSchedules.endTime]
                }
                
                // Step 6: Generate 1-hour slots
                var currentTime = startTime
                while (currentTime.plusHours(SLOT_DURATION_HOURS) <= endTime) {
                    val slotStart = ZonedDateTime.of(date, currentTime, zoneId).toInstant()
                    val slotEnd = ZonedDateTime.of(date, currentTime.plusHours(SLOT_DURATION_HOURS), zoneId).toInstant()
                    
                    // Check lead time (must be at least 2 hours from now)
                    if (slotStart.isAfter(now.plusSeconds(LEAD_TIME_HOURS * 3600))) {
                        slots.add(AvailableSlotDTO(
                            start = slotStart.toString(),
                            end = slotEnd.toString()
                        ))
                    }
                    
                    currentTime = currentTime.plusHours(SLOT_DURATION_HOURS)
                }
            }
            
            // Step 7: Remove slots that overlap with existing appointments
            val existingAppointments = Appointments.select {
                (Appointments.doctorId eq doctorId) and
                (Appointments.status inList listOf("pending", "confirmed")) and
                (Appointments.startTime.isNotNull()) and
                (Appointments.endTime.isNotNull())
            }.mapNotNull { row ->
                val start = row[Appointments.startTime]
                val end = row[Appointments.endTime]
                if (start != null && end != null) {
                    Pair(start, end)
                } else null
            }
            
            val availableSlots = slots.filter { slot ->
                val slotStart = Instant.parse(slot.start)
                val slotEnd = Instant.parse(slot.end)
                
                // Check if this slot overlaps with any existing appointment
                existingAppointments.none { (appointmentStart, appointmentEnd) ->
                    slotStart < appointmentEnd && slotEnd > appointmentStart
                }
            }
            
            availableSlots
        }
    }

    /**
     * Get all doctors' schedules for a specific date (for admin view)
     */
    fun getAdminSchedulesByDate(date: LocalDate): List<DoctorScheduleResponse> {
        return transaction {
            val now = Instant.now()
            val zoneId = ZoneId.of("UTC")
            val dayOfWeek = date.dayOfWeek.value
            
            // 1. Get all doctors
            val doctors = SupabaseDoctors.selectAll().toList()
            
            // 2. Get all weekly schedules for this day of week
            val allWeeklySchedules = WeeklyWorkSchedules.select {
                (WeeklyWorkSchedules.dayOfWeek eq dayOfWeek) and
                (WeeklyWorkSchedules.isActive eq true)
            }.groupBy { it[WeeklyWorkSchedules.doctorId] }
            
            // 3. Get all exceptions for this date
            val allExceptions = ScheduleExceptions.select {
                ScheduleExceptions.exceptionDate eq date
            }.groupBy { it[ScheduleExceptions.doctorId] }
            
            // 4. Get all approved leave requests for this date
            val allLeaveRequests = LeaveRequests.select {
                (LeaveRequests.status eq "approved") and
                (LeaveRequests.startDate lessEq date) and
                (LeaveRequests.endDate greaterEq date)
            }.groupBy { it[LeaveRequests.doctorId] }
            
            // 5. Get all appointments for this date to mark booked slots
            val startOfDay = date.atStartOfDay(zoneId).toInstant()
            val endOfDay = date.plusDays(1).atStartOfDay(zoneId).toInstant()
            val allAppointments = Appointments.select {
                (Appointments.status inList listOf("pending", "confirmed")) and
                (Appointments.startTime greaterEq startOfDay) and
                (Appointments.startTime less endOfDay)
            }.groupBy { it[Appointments.doctorId] }
            
            val result = mutableListOf<DoctorScheduleResponse>()
            
            for (doctorRow in doctors) {
                val doctorId = doctorRow[SupabaseDoctors.id]
                val doctorName = doctorRow[SupabaseDoctors.fullName]
                val specialty = doctorRow[SupabaseDoctors.specialty]
                
                // Skip if doctor has approved leave
                if (allLeaveRequests.containsKey(doctorId)) continue
                
                val weeklySchedules = allWeeklySchedules[doctorId] ?: continue
                val doctorExceptions = allExceptions[doctorId]?.associateBy { it[ScheduleExceptions.session] } ?: emptyMap()
                val doctorAppointments = allAppointments[doctorId] ?: emptyList()
                
                for (schedule in weeklySchedules) {
                    val session = schedule[WeeklyWorkSchedules.session]
                    val exception = doctorExceptions[session] ?: doctorExceptions[null]
                    
                    if (exception != null && exception[ScheduleExceptions.exceptionType] == "off") continue
                    
                    val startTime = if (exception != null && exception[ScheduleExceptions.exceptionType] == "override") {
                        exception[ScheduleExceptions.overrideStartTime]!!
                    } else {
                        schedule[WeeklyWorkSchedules.startTime]
                    }
                    
                    val endTime = if (exception != null && exception[ScheduleExceptions.exceptionType] == "override") {
                        exception[ScheduleExceptions.overrideEndTime]!!
                    } else {
                        schedule[WeeklyWorkSchedules.endTime]
                    }
                    
                    var currentTime = startTime
                    while (currentTime.plusHours(SLOT_DURATION_HOURS) <= endTime) {
                        val slotStart = ZonedDateTime.of(date, currentTime, zoneId).toInstant()
                        val slotEnd = ZonedDateTime.of(date, currentTime.plusHours(SLOT_DURATION_HOURS), zoneId).toInstant()
                        
                        // Check if this slot is booked
                        val isBooked = doctorAppointments.any { row ->
                            val appStart = row[Appointments.startTime]
                            val appEnd = row[Appointments.endTime]
                            appStart != null && appEnd != null && slotStart < appEnd && slotEnd > appStart
                        }
                        
                        result.add(DoctorScheduleResponse(
                            id = UUID.randomUUID().toString(),
                            doctorId = doctorId.toString(),
                            doctorName = doctorName,
                            specialty = specialty,
                            workDate = date.toString(),
                            slotStart = currentTime.format(timeFormatter),
                            slotEnd = currentTime.plusHours(SLOT_DURATION_HOURS).format(timeFormatter),
                            isBooked = isBooked,
                            createdAt = now.toString()
                        ))
                        
                        currentTime = currentTime.plusHours(SLOT_DURATION_HOURS)
                    }
                }
            }
            
            result
        }
    }
    
    /**
     * Validate if a time slot is available for booking
     */
    fun validateSlot(doctorId: UUID, startTime: Instant, endTime: Instant): Result<Unit> {
        return transaction {
            val date = LocalDate.ofInstant(startTime, ZoneId.of("UTC"))
            val now = Instant.now()
            
            // Check lead time
            if (startTime.isBefore(now.plusSeconds(LEAD_TIME_HOURS * 3600))) {
                return@transaction Result.failure(Exception("Appointments must be booked at least $LEAD_TIME_HOURS hours in advance"))
            }
            
            // Check max booking window
            if (startTime.isAfter(now.plusSeconds(MAX_BOOKING_DAYS * 24 * 3600))) {
                return@transaction Result.failure(Exception("Appointments can only be booked up to $MAX_BOOKING_DAYS days in advance"))
            }
            
            // Check if time is valid (start < end)
            if (startTime >= endTime) {
                return@transaction Result.failure(Exception("Start time must be before end time"))
            }
            
            // Check if doctor has schedule on this day
            val availableSlots = getAvailableSlots(doctorId, date)
            val requestedSlot = availableSlots.find { 
                it.start == startTime.toString() && it.end == endTime.toString() 
            }
            
            if (requestedSlot == null) {
                return@transaction Result.failure(Exception("Selected time slot is not available"))
            }
            
            Result.success(Unit)
        }
    }
    
    private fun ResultRow.toWeeklyScheduleDTO() = WeeklyScheduleDTO(
        id = this[WeeklyWorkSchedules.id].toString(),
        doctorId = this[WeeklyWorkSchedules.doctorId].toString(),
        dayOfWeek = this[WeeklyWorkSchedules.dayOfWeek],
        session = this[WeeklyWorkSchedules.session],
        startTime = this[WeeklyWorkSchedules.startTime].format(timeFormatter),
        endTime = this[WeeklyWorkSchedules.endTime].format(timeFormatter),
        isActive = this[WeeklyWorkSchedules.isActive],
        createdAt = this[WeeklyWorkSchedules.createdAt].toString(),
        updatedAt = this[WeeklyWorkSchedules.updatedAt].toString()
    )
}
