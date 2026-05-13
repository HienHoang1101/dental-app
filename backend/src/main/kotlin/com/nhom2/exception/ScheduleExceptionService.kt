package com.nhom2.exception

import com.nhom2.common.*
import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID

object ScheduleExceptionService {
    
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
    
    /**
     * Add a schedule exception
     */
    fun addException(doctorId: UUID, request: CreateExceptionRequest): Result<ScheduleExceptionDTO> {
        return transaction {
            // Validate exception type
            if (request.exceptionType !in listOf("off", "override")) {
                return@transaction Result.failure(Exception("Invalid exception type. Must be 'off' or 'override'"))
            }
            
            // Validate session if provided
            if (request.session != null && request.session !in listOf("morning", "afternoon")) {
                return@transaction Result.failure(Exception("Invalid session. Must be 'morning' or 'afternoon'"))
            }
            
            // Parse date
            val exceptionDate = try {
                LocalDate.parse(request.exceptionDate)
            } catch (e: Exception) {
                return@transaction Result.failure(Exception("Invalid date format. Use YYYY-MM-DD"))
            }
            
            // Validate override times if type is 'override'
            if (request.exceptionType == "override") {
                if (request.overrideStartTime == null || request.overrideEndTime == null) {
                    return@transaction Result.failure(Exception("Override start and end times are required for 'override' type"))
                }
                
                val startTime = try {
                    LocalTime.parse(request.overrideStartTime, timeFormatter)
                } catch (e: Exception) {
                    return@transaction Result.failure(Exception("Invalid start time format. Use HH:mm"))
                }
                
                val endTime = try {
                    LocalTime.parse(request.overrideEndTime, timeFormatter)
                } catch (e: Exception) {
                    return@transaction Result.failure(Exception("Invalid end time format. Use HH:mm"))
                }
                
                if (startTime >= endTime) {
                    return@transaction Result.failure(Exception("Start time must be before end time"))
                }
            }
            
            // Check if exception already exists
            val existing = ScheduleExceptions.select {
                (ScheduleExceptions.doctorId eq doctorId) and
                (ScheduleExceptions.exceptionDate eq exceptionDate) and
                (ScheduleExceptions.session eq request.session)
            }.singleOrNull()
            
            if (existing != null) {
                return@transaction Result.failure(Exception("Exception already exists for this date and session"))
            }
            
            // Insert exception
            val id = ScheduleExceptions.insert {
                it[ScheduleExceptions.doctorId] = doctorId
                it[ScheduleExceptions.exceptionDate] = exceptionDate
                it[exceptionType] = request.exceptionType
                it[session] = request.session
                it[overrideStartTime] = request.overrideStartTime?.let { time -> 
                    LocalTime.parse(time, timeFormatter) 
                }
                it[overrideEndTime] = request.overrideEndTime?.let { time -> 
                    LocalTime.parse(time, timeFormatter) 
                }
                it[reason] = request.reason
                it[createdAt] = Instant.now()
            } get ScheduleExceptions.id
            
            val exception = ScheduleExceptions.select { ScheduleExceptions.id eq id }
                .single()
                .toScheduleExceptionDTO()
            
            Result.success(exception)
        }
    }
    
    /**
     * Get exceptions for a doctor within a date range
     */
    fun getExceptions(doctorId: UUID, startDate: LocalDate, endDate: LocalDate): List<ScheduleExceptionDTO> {
        return transaction {
            ScheduleExceptions.select {
                (ScheduleExceptions.doctorId eq doctorId) and
                (ScheduleExceptions.exceptionDate greaterEq startDate) and
                (ScheduleExceptions.exceptionDate lessEq endDate)
            }.orderBy(ScheduleExceptions.exceptionDate to SortOrder.ASC)
             .map { it.toScheduleExceptionDTO() }
        }
    }
    
    /**
     * Get all exceptions for a doctor
     */
    fun getAllExceptions(doctorId: UUID): List<ScheduleExceptionDTO> {
        return transaction {
            ScheduleExceptions.select { ScheduleExceptions.doctorId eq doctorId }
                .orderBy(ScheduleExceptions.exceptionDate to SortOrder.ASC)
                .map { it.toScheduleExceptionDTO() }
        }
    }
    
    /**
     * Get exception by ID
     */
    fun getExceptionById(id: UUID): ScheduleExceptionDTO? {
        return transaction {
            ScheduleExceptions.select { ScheduleExceptions.id eq id }
                .singleOrNull()
                ?.toScheduleExceptionDTO()
        }
    }
    
    /**
     * Delete an exception
     */
    fun deleteException(id: UUID): Boolean {
        return transaction {
            ScheduleExceptions.deleteWhere { ScheduleExceptions.id eq id } > 0
        }
    }
    
    /**
     * Delete exceptions for a specific date
     */
    fun deleteExceptionsByDate(doctorId: UUID, date: LocalDate, session: String? = null): Int {
        return transaction {
            if (session != null) {
                ScheduleExceptions.deleteWhere { (ScheduleExceptions.doctorId eq doctorId) and (ScheduleExceptions.exceptionDate eq date) and (ScheduleExceptions.session eq session) }
            } else {
                ScheduleExceptions.deleteWhere { (ScheduleExceptions.doctorId eq doctorId) and (ScheduleExceptions.exceptionDate eq date) }
            }
        }
    }
    
    private fun ResultRow.toScheduleExceptionDTO() = ScheduleExceptionDTO(
        id = this[ScheduleExceptions.id].toString(),
        doctorId = this[ScheduleExceptions.doctorId].toString(),
        exceptionDate = this[ScheduleExceptions.exceptionDate].toString(),
        exceptionType = this[ScheduleExceptions.exceptionType],
        session = this[ScheduleExceptions.session],
        overrideStartTime = this[ScheduleExceptions.overrideStartTime]?.format(timeFormatter),
        overrideEndTime = this[ScheduleExceptions.overrideEndTime]?.format(timeFormatter),
        reason = this[ScheduleExceptions.reason],
        createdAt = this[ScheduleExceptions.createdAt].toString()
    )
}
