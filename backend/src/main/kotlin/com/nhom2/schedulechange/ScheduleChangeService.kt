package com.nhom2.schedulechange

import com.nhom2.common.*
import com.nhom2.models.*
import com.nhom2.weekschedule.WeeklyScheduleService
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.statements.api.ExposedBlob
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.transactions.TransactionManager
import java.time.Instant
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID

object ScheduleChangeService {
    
    private val json = Json { ignoreUnknownKeys = true }
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
    
    /**
     * Create a schedule change request
     */
    fun createRequest(doctorId: UUID, request: CreateScheduleChangeRequest): ScheduleChangeRequestDTO {
        return transaction {
            try {
                println("DEBUG: Creating schedule change request for doctor: $doctorId")
                println("DEBUG: Request type: ${request.requestType}")
                println("DEBUG: Old data: ${request.oldScheduleData}")
                println("DEBUG: New data: ${request.newScheduleData}")
                
                // Validate request type
                if (request.requestType !in listOf("add", "remove", "modify")) {
                    throw IllegalArgumentException("Invalid request type. Must be 'add', 'remove', or 'modify'")
                }
                
                // Validate data based on request type
                when (request.requestType) {
                    "add" -> {
                        if (request.newScheduleData == null) {
                            throw IllegalArgumentException("newScheduleData is required for 'add' request")
                        }
                    }
                    "remove" -> {
                        if (request.oldScheduleData == null) {
                            throw IllegalArgumentException("oldScheduleData is required for 'remove' request")
                        }
                    }
                    "modify" -> {
                        if (request.oldScheduleData == null || request.newScheduleData == null) {
                            throw IllegalArgumentException("Both oldScheduleData and newScheduleData are required for 'modify' request")
                        }
                    }
                }
                
                // Serialize schedule data to JSON
                val oldDataJson = request.oldScheduleData?.let { json.encodeToString(it) }
                val newDataJson = request.newScheduleData?.let { json.encodeToString(it) }
                
                println("DEBUG: Old data JSON: $oldDataJson")
                println("DEBUG: New data JSON: $newDataJson")
                
                // Use Exposed DSL to insert
                val insertedRequestRow = ScheduleChangeRequests.insert {
                    it[ScheduleChangeRequests.doctorId] = doctorId
                    it[ScheduleChangeRequests.requestType] = request.requestType
                    it[ScheduleChangeRequests.oldScheduleData] = oldDataJson
                    it[ScheduleChangeRequests.newScheduleData] = newDataJson
                    it[ScheduleChangeRequests.status] = "pending"
                    it[ScheduleChangeRequests.createdAt] = Instant.now()
                }
                
                val id = insertedRequestRow[ScheduleChangeRequests.id]
                println("DEBUG: Inserted with ID: $id")
                
                // Get the inserted request
                println("DEBUG: Fetching inserted request...")
                val insertedRequest = ScheduleChangeRequests
                    .select { ScheduleChangeRequests.id eq id }
                    .single()
                    .toScheduleChangeRequestDTO()
                
                println("DEBUG: Successfully created request: ${insertedRequest.id}")
                insertedRequest
            } catch (e: Exception) {
                println("ERROR: Failed to create schedule change request: ${e.message}")
                e.printStackTrace()
                throw e
            }
        }
    }
    
    /**
     * Get a schedule change request by ID
     */
    fun getRequestById(id: UUID): ScheduleChangeRequestDTO? {
        return transaction {
            ScheduleChangeRequests.select { ScheduleChangeRequests.id eq id }
                .singleOrNull()
                ?.toScheduleChangeRequestDTO()
        }
    }
    
    /**
     * Get all requests for a doctor
     */
    fun getByDoctor(doctorId: UUID, status: String? = null): List<ScheduleChangeRequestDTO> {
        return transaction {
            var query = ScheduleChangeRequests.select { ScheduleChangeRequests.doctorId eq doctorId }
            
            status?.let {
                query = query.andWhere { ScheduleChangeRequests.status eq it }
            }
            
            query.orderBy(ScheduleChangeRequests.createdAt to SortOrder.DESC)
                .map { it.toScheduleChangeRequestDTO() }
        }
    }
    
    /**
     * Get all pending requests (for admin)
     */
    fun getPending(): List<ScheduleChangeRequestDTO> {
        return transaction {
            ScheduleChangeRequests.select { ScheduleChangeRequests.status eq "pending" }
                .orderBy(ScheduleChangeRequests.createdAt to SortOrder.ASC)
                .map { it.toScheduleChangeRequestDTO() }
        }
    }
    
    /**
     * Get all requests with pagination (for admin)
     */
    fun getAllRequests(page: Int = 1, pageSize: Int = 20, status: String? = null): PaginatedResponse<ScheduleChangeRequestDTO> {
        return transaction {
            var query = ScheduleChangeRequests.selectAll()
            
            status?.let {
                query = query.andWhere { ScheduleChangeRequests.status eq it }
            }
            
            val total = query.count().toInt()
            val items = query
                .orderBy(ScheduleChangeRequests.createdAt to SortOrder.DESC)
                .limit(pageSize, offset = ((page - 1) * pageSize).toLong())
                .map { it.toScheduleChangeRequestDTO() }
            
            PaginatedResponse(
                items = items,
                total = total,
                page = page,
                pageSize = pageSize,
                totalPages = (total + pageSize - 1) / pageSize
            )
        }
    }
    
    /**
     * Approve a schedule change request
     */
    fun approve(id: UUID, reviewerId: UUID): ScheduleChangeRequestDTO {
        return transaction {
            val request = ScheduleChangeRequests.select { ScheduleChangeRequests.id eq id }
                .singleOrNull()
                ?: throw IllegalArgumentException("Request not found")
            
            if (request[ScheduleChangeRequests.status] != "pending") {
                throw IllegalArgumentException("Request has already been reviewed")
            }
            
            val doctorId = request[ScheduleChangeRequests.doctorId]
            val requestType = request[ScheduleChangeRequests.requestType]
            
            // Apply the change to weekly_work_schedules
            when (requestType) {
                "add" -> {
                    val newData = json.decodeFromString<ScheduleDataDTO>(
                        request[ScheduleChangeRequests.newScheduleData]!!
                    )
                    WeeklyScheduleService.upsert(doctorId, CreateWeeklyScheduleRequest(
                        dayOfWeek = newData.dayOfWeek,
                        session = newData.session,
                        startTime = newData.startTime,
                        endTime = newData.endTime
                    ))
                }
                "remove" -> {
                    val oldData = json.decodeFromString<ScheduleDataDTO>(
                        request[ScheduleChangeRequests.oldScheduleData]!!
                    )
                    // Find and deactivate the schedule
                    val schedules = WeeklyScheduleService.getByDoctor(doctorId)
                    val scheduleToRemove = schedules.find {
                        it.dayOfWeek == oldData.dayOfWeek && it.session == oldData.session
                    }
                    scheduleToRemove?.let {
                        WeeklyScheduleService.deactivate(UUID.fromString(it.id))
                    }
                }
                "modify" -> {
                    val newData = json.decodeFromString<ScheduleDataDTO>(
                        request[ScheduleChangeRequests.newScheduleData]!!
                    )
                    WeeklyScheduleService.upsert(doctorId, CreateWeeklyScheduleRequest(
                        dayOfWeek = newData.dayOfWeek,
                        session = newData.session,
                        startTime = newData.startTime,
                        endTime = newData.endTime
                    ))
                }
            }
            
            // Update request status
            ScheduleChangeRequests.update({ ScheduleChangeRequests.id eq id }) {
                it[status] = "approved"
                it[ScheduleChangeRequests.reviewedBy] = reviewerId
                it[reviewedAt] = Instant.now()
            }
            
            getRequestById(id)!!
        }
    }
    
    /**
     * Reject a schedule change request
     */
    fun reject(id: UUID, reviewerId: UUID, reason: String): ScheduleChangeRequestDTO {
        return transaction {
            val request = ScheduleChangeRequests.select { ScheduleChangeRequests.id eq id }
                .singleOrNull()
                ?: throw IllegalArgumentException("Request not found")
            
            if (request[ScheduleChangeRequests.status] != "pending") {
                throw IllegalArgumentException("Request has already been reviewed")
            }
            
            ScheduleChangeRequests.update({ ScheduleChangeRequests.id eq id }) {
                it[status] = "rejected"
                it[rejectionReason] = reason
                it[ScheduleChangeRequests.reviewedBy] = reviewerId
                it[reviewedAt] = Instant.now()
            }
            
            getRequestById(id)!!
        }
    }
    
    private fun ResultRow.toScheduleChangeRequestDTO(): ScheduleChangeRequestDTO {
        val doctorId = this[ScheduleChangeRequests.doctorId]
        val reviewerId = this[ScheduleChangeRequests.reviewedBy]
        
        // Get doctor name
        val doctor = SupabaseDoctors.select { SupabaseDoctors.id eq doctorId }
            .singleOrNull()
        val doctorName = doctor?.get(SupabaseDoctors.fullName) ?: "Unknown"
        
        // Get reviewer name
        val reviewer = reviewerId?.let {
            Users.select { Users.id eq it }.singleOrNull()
        }
        val reviewerName = reviewer?.get(Users.fullName)
        
        // Parse schedule data
        val oldData = this[ScheduleChangeRequests.oldScheduleData]?.let {
            json.decodeFromString<ScheduleDataDTO>(it)
        }
        val newData = this[ScheduleChangeRequests.newScheduleData]?.let {
            json.decodeFromString<ScheduleDataDTO>(it)
        }
        
        return ScheduleChangeRequestDTO(
            id = this[ScheduleChangeRequests.id].toString(),
            doctorId = doctorId.toString(),
            doctorName = doctorName,
            requestType = this[ScheduleChangeRequests.requestType],
            oldScheduleData = oldData,
            newScheduleData = newData,
            status = this[ScheduleChangeRequests.status],
            rejectionReason = this[ScheduleChangeRequests.rejectionReason],
            reviewedBy = reviewerId?.toString(),
            reviewedByName = reviewerName,
            reviewedAt = this[ScheduleChangeRequests.reviewedAt]?.toString(),
            createdAt = this[ScheduleChangeRequests.createdAt].toString()
        )
    }
}
