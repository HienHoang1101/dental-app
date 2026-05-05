package com.nhom2.schedule

import com.nhom2.common.*
import com.nhom2.models.*
import com.nhom2.doctors.SupabaseDoctorService
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.LocalTime
import java.time.Instant
import java.util.UUID

object ScheduleService {
    
    // ── Shift Management ─────────────────────────────
    fun createShift(request: CreateShiftRequest): ShiftDTO {
        return transaction {
            val id = Shifts.insert {
                it[name] = request.name
                it[startTime] = LocalTime.parse(request.startTime)
                it[endTime] = LocalTime.parse(request.endTime)
                it[createdAt] = Instant.now()
            } get Shifts.id

            getShiftById(id)!!
        }
    }

    fun getShiftById(id: UUID): ShiftDTO? {
        return transaction {
            Shifts.select { Shifts.id eq id }
                .map { it.toShiftDTO() }
                .singleOrNull()
        }
    }

    fun getAllShifts(): List<ShiftDTO> {
        return transaction {
            Shifts.selectAll().map { it.toShiftDTO() }
        }
    }

    fun updateShift(id: UUID, request: UpdateShiftRequest): ShiftDTO? {
        return transaction {
            val exists = Shifts.select { Shifts.id eq id }.count() > 0
            if (!exists) return@transaction null

            Shifts.update({ Shifts.id eq id }) {
                request.name?.let { v -> it[name] = v }
                request.startTime?.let { v -> it[startTime] = LocalTime.parse(v) }
                request.endTime?.let { v -> it[endTime] = LocalTime.parse(v) }
            }

            getShiftById(id)
        }
    }

    fun deleteShift(id: UUID): Boolean {
        return transaction {
            // Check if shift has any work schedules
            val hasWorkSchedules = WorkSchedules.select { 
                WorkSchedules.shiftId eq id 
            }.count() > 0

            if (hasWorkSchedules) {
                return@transaction false
            }

            Shifts.deleteWhere { Shifts.id eq id } > 0
        }
    }

    // ── Work Schedule Management ─────────────────────
    fun createWorkSchedule(request: CreateWorkScheduleRequest): Result<WorkScheduleDTO> {
        return transaction {
            // Check for conflicts
            val exists = WorkSchedules.select {
                (WorkSchedules.doctorId eq UUID.fromString(request.doctorId)) and
                (WorkSchedules.shiftId eq UUID.fromString(request.shiftId)) and
                (WorkSchedules.date eq LocalDate.parse(request.date))
            }.count() > 0

            if (exists) {
                return@transaction Result.failure(Exception("Work schedule already exists for this doctor, shift, and date"))
            }

            // Check if date is holiday
            val isHoliday = Holidays.select { Holidays.date eq LocalDate.parse(request.date) }.count() > 0
            if (isHoliday) {
                return@transaction Result.failure(Exception("Cannot create work schedule on holiday"))
            }

            // Check for approved leave requests
            val doctorId = UUID.fromString(request.doctorId)
            val date = LocalDate.parse(request.date)
            val hasLeave = LeaveRequests.select {
                (LeaveRequests.doctorId eq doctorId) and
                (LeaveRequests.status eq "approved") and
                (LeaveRequests.startDate lessEq date) and
                (LeaveRequests.endDate greaterEq date)
            }.count() > 0

            if (hasLeave) {
                return@transaction Result.failure(Exception("Doctor has approved leave on this date"))
            }

            val id = WorkSchedules.insert {
                it[WorkSchedules.doctorId] = doctorId
                it[shiftId] = UUID.fromString(request.shiftId)
                it[WorkSchedules.date] = date
                it[slotDuration] = request.slotDuration
                it[maxPatientPerSlot] = request.maxPatientPerSlot
                it[createdAt] = Instant.now()
            } get WorkSchedules.id

            // Generate time slots
            generateTimeSlots(id, UUID.fromString(request.shiftId), request.slotDuration, request.maxPatientPerSlot)

            Result.success(getWorkScheduleById(id)!!)
        }
    }

    private fun generateTimeSlots(workScheduleId: UUID, shiftId: UUID, slotDuration: Int, maxPatients: Int) {
        transaction {
            val shift = Shifts.select { Shifts.id eq shiftId }.single()
            var currentTime = shift[Shifts.startTime]
            val endTime = shift[Shifts.endTime]

            while (currentTime.plusMinutes(slotDuration.toLong()) <= endTime) {
                val slotEndTime = currentTime.plusMinutes(slotDuration.toLong())
                
                TimeSlots.insert {
                    it[TimeSlots.workScheduleId] = workScheduleId
                    it[startTime] = currentTime
                    it[TimeSlots.endTime] = slotEndTime
                    it[maxPatientPerSlot] = maxPatients
                    it[createdAt] = Instant.now()
                }

                currentTime = slotEndTime
            }
        }
    }

    fun getWorkScheduleById(id: UUID): WorkScheduleDTO? {
        return transaction {
            WorkSchedules.select { WorkSchedules.id eq id }
                .singleOrNull()
                ?.toWorkScheduleDTO()
        }
    }

    fun getWorkSchedules(date: LocalDate?, doctorId: UUID?): List<WorkScheduleDTO> {
        return transaction {
            var query = WorkSchedules.selectAll()

            date?.let {
                query = query.andWhere { WorkSchedules.date eq it }
            }

            doctorId?.let {
                query = query.andWhere { WorkSchedules.doctorId eq it }
            }

            query.orderBy(WorkSchedules.date to SortOrder.ASC)
                .map { it.toWorkScheduleDTO() }
        }
    }

    fun getWorkSchedulesByDoctor(doctorId: UUID, startDate: LocalDate?, endDate: LocalDate?): List<WorkScheduleDTO> {
        return transaction {
            var query = WorkSchedules.select { WorkSchedules.doctorId eq doctorId }

            startDate?.let {
                query = query.andWhere { WorkSchedules.date greaterEq it }
            }

            endDate?.let {
                query = query.andWhere { WorkSchedules.date lessEq it }
            }

            query.orderBy(WorkSchedules.date to SortOrder.ASC)
                .map { it.toWorkScheduleDTO() }
        }
    }

    fun getAvailableTimeSlots(doctorId: UUID, date: LocalDate): List<TimeSlotDTO> {
        return transaction {
            val workSchedules = WorkSchedules.select {
                (WorkSchedules.doctorId eq doctorId) and (WorkSchedules.date eq date)
            }

            workSchedules.flatMap { ws ->
                val wsId = ws[WorkSchedules.id]
                TimeSlots.select { TimeSlots.workScheduleId eq wsId }
                    .map { it.toTimeSlotDTOWithAvailability() }
                    .filter { it.isAvailable }
            }
        }
    }

    fun deleteWorkSchedule(id: UUID): Boolean {
        return transaction {
            // Check if there are any appointments
            val timeSlotIds = TimeSlots.select { TimeSlots.workScheduleId eq id }
                .map { it[TimeSlots.id] }

            val hasAppointments = Appointments.select {
                (Appointments.timeSlotId inList timeSlotIds) and
                (Appointments.status inList listOf("pending", "confirmed"))
            }.count() > 0

            if (hasAppointments) {
                return@transaction false
            }

            TimeSlots.deleteWhere { TimeSlots.workScheduleId eq id }
            WorkSchedules.deleteWhere { WorkSchedules.id eq id } > 0
        }
    }

    // ── Holiday Management ───────────────────────────
    fun createHoliday(request: CreateHolidayRequest): HolidayDTO {
        return transaction {
            val id = Holidays.insert {
                it[date] = LocalDate.parse(request.date)
                it[name] = request.name
                it[description] = request.description
                it[createdAt] = Instant.now()
            } get Holidays.id

            getHolidayById(id)!!
        }
    }

    fun getHolidayById(id: UUID): HolidayDTO? {
        return transaction {
            Holidays.select { Holidays.id eq id }
                .map { it.toHolidayDTO() }
                .singleOrNull()
        }
    }

    fun getAllHolidays(): List<HolidayDTO> {
        return transaction {
            Holidays.selectAll()
                .orderBy(Holidays.date to SortOrder.ASC)
                .map { it.toHolidayDTO() }
        }
    }

    fun deleteHoliday(id: UUID): Boolean {
        return transaction {
            Holidays.deleteWhere { Holidays.id eq id } > 0
        }
    }

    // ── Leave Request Management ─────────────────────
    fun createLeaveRequest(doctorId: UUID, request: CreateLeaveRequestRequest): LeaveRequestDTO {
        return transaction {
            val id = LeaveRequests.insert {
                it[LeaveRequests.doctorId] = doctorId
                it[startDate] = LocalDate.parse(request.startDate)
                it[endDate] = LocalDate.parse(request.endDate)
                it[reason] = request.reason
                it[status] = "pending"
                it[createdAt] = Instant.now()
            } get LeaveRequests.id

            getLeaveRequestById(id)!!
        }
    }

    fun getLeaveRequestById(id: UUID): LeaveRequestDTO? {
        return transaction {
            LeaveRequests.select { LeaveRequests.id eq id }
                .singleOrNull()
                ?.toLeaveRequestDTO()
        }
    }

    fun getLeaveRequestsByDoctor(doctorId: UUID): List<LeaveRequestDTO> {
        return transaction {
            LeaveRequests.select { LeaveRequests.doctorId eq doctorId }
                .orderBy(LeaveRequests.createdAt to SortOrder.DESC)
                .map { it.toLeaveRequestDTO() }
        }
    }

    fun getAllLeaveRequests(status: String? = null): List<LeaveRequestDTO> {
        return transaction {
            var query = LeaveRequests.selectAll()
            
            status?.let {
                query = query.andWhere { LeaveRequests.status eq it }
            }

            query.orderBy(LeaveRequests.createdAt to SortOrder.DESC)
                .map { it.toLeaveRequestDTO() }
        }
    }

    fun reviewLeaveRequest(id: UUID, reviewedBy: UUID, request: ReviewLeaveRequestRequest): LeaveRequestDTO? {
        return transaction {
            val exists = LeaveRequests.select { LeaveRequests.id eq id }.count() > 0
            if (!exists) return@transaction null

            LeaveRequests.update({ LeaveRequests.id eq id }) {
                it[status] = request.status
                it[LeaveRequests.reviewedBy] = reviewedBy
                it[reviewedAt] = Instant.now()
            }

            getLeaveRequestById(id)
        }
    }

    // ── Helper Functions ─────────────────────────────
    private fun ResultRow.toShiftDTO() = ShiftDTO(
        id = this[Shifts.id].toString(),
        name = this[Shifts.name],
        startTime = this[Shifts.startTime].toString(),
        endTime = this[Shifts.endTime].toString(),
        createdAt = this[Shifts.createdAt].toString()
    )

    private fun ResultRow.toWorkScheduleDTO(): WorkScheduleDTO {
        val wsId = this[WorkSchedules.id]
        val doctorId = this[WorkSchedules.doctorId]
        val shiftId = this[WorkSchedules.shiftId]

        val doctor = SupabaseDoctorService.getDoctorSummary(doctorId)!!
        val shift = getShiftById(shiftId)!!
        val timeSlots = TimeSlots.select { TimeSlots.workScheduleId eq wsId }
            .map { it.toTimeSlotDTOWithAvailability() }

        return WorkScheduleDTO(
            id = wsId.toString(),
            doctor = doctor,
            shift = shift,
            date = this[WorkSchedules.date].toString(),
            slotDuration = this[WorkSchedules.slotDuration],
            maxPatientPerSlot = this[WorkSchedules.maxPatientPerSlot],
            timeSlots = timeSlots,
            createdAt = this[WorkSchedules.createdAt].toString()
        )
    }

    private fun ResultRow.toTimeSlotDTOWithAvailability(): TimeSlotDTO {
        val slotId = this[TimeSlots.id]
        val maxPatients = this[TimeSlots.maxPatientPerSlot]
        
        val currentBookings = Appointments.select {
            (Appointments.timeSlotId eq slotId) and
            (Appointments.status inList listOf("pending", "confirmed"))
        }.count().toInt()

        val remaining = maxPatients - currentBookings

        return TimeSlotDTO(
            id = slotId.toString(),
            workScheduleId = this[TimeSlots.workScheduleId].toString(),
            startTime = this[TimeSlots.startTime].toString(),
            endTime = this[TimeSlots.endTime].toString(),
            maxPatientPerSlot = maxPatients,
            currentBookings = currentBookings,
            remainingCapacity = remaining,
            isAvailable = remaining > 0,
            createdAt = this[TimeSlots.createdAt].toString()
        )
    }

    private fun ResultRow.toHolidayDTO() = HolidayDTO(
        id = this[Holidays.id].toString(),
        date = this[Holidays.date].toString(),
        name = this[Holidays.name],
        description = this[Holidays.description],
        createdAt = this[Holidays.createdAt].toString()
    )

    private fun ResultRow.toLeaveRequestDTO(): LeaveRequestDTO {
        val doctorId = this[LeaveRequests.doctorId]
        val reviewedById = this[LeaveRequests.reviewedBy]

        val doctor = SupabaseDoctorService.getDoctorSummary(doctorId)!!
        val reviewedBy = reviewedById?.let { id ->
            Users.select { Users.id eq id }.singleOrNull()?.toUserDTO()
        }

        return LeaveRequestDTO(
            id = this[LeaveRequests.id].toString(),
            doctor = doctor,
            startDate = this[LeaveRequests.startDate].toString(),
            endDate = this[LeaveRequests.endDate].toString(),
            reason = this[LeaveRequests.reason],
            status = this[LeaveRequests.status],
            reviewedBy = reviewedBy,
            reviewedAt = this[LeaveRequests.reviewedAt]?.toString(),
            createdAt = this[LeaveRequests.createdAt].toString()
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
}
