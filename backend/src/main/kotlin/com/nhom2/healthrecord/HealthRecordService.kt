package com.nhom2.healthrecord

import com.nhom2.common.*
import com.nhom2.models.HealthRecords
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.Instant
import java.util.UUID

object HealthRecordService {
    
    fun createHealthRecord(userId: UUID, request: CreateHealthRecordRequest): HealthRecordDTO {
        return transaction {
            val id = HealthRecords.insert {
                it[HealthRecords.userId] = userId
                it[fullName] = request.fullName
                it[dateOfBirth] = LocalDate.parse(request.dateOfBirth)
                it[ethnicity] = request.ethnicity
                it[gender] = request.gender
                it[occupation] = request.occupation
                it[phone] = request.phone
                it[email] = request.email
                it[nationalId] = request.nationalId
                it[address] = request.address
                it[allergyNotes] = request.allergyNotes
                it[medicalHistory] = request.medicalHistory
                it[dentalStatus] = request.dentalStatus
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get HealthRecords.id

            getHealthRecordById(id)!!
        }
    }

    fun getHealthRecordByUserId(userId: UUID): HealthRecordDTO? {
        return transaction {
            HealthRecords.select { HealthRecords.userId eq userId }
                .map { it.toHealthRecordDTO() }
                .singleOrNull()
        }
    }

    fun getHealthRecordById(id: UUID): HealthRecordDTO? {
        return transaction {
            HealthRecords.select { HealthRecords.id eq id }
                .map { it.toHealthRecordDTO() }
                .singleOrNull()
        }
    }

    fun updateHealthRecord(userId: UUID, request: UpdateHealthRecordRequest): HealthRecordDTO? {
        return transaction {
            val existing = HealthRecords.select { HealthRecords.userId eq userId }
                .singleOrNull() ?: return@transaction null

            HealthRecords.update({ HealthRecords.userId eq userId }) {
                request.fullName?.let { v -> it[fullName] = v }
                request.dateOfBirth?.let { v -> it[dateOfBirth] = LocalDate.parse(v) }
                request.ethnicity?.let { v -> it[ethnicity] = v }
                request.gender?.let { v -> it[gender] = v }
                request.occupation?.let { v -> it[occupation] = v }
                request.phone?.let { v -> it[phone] = v }
                request.email?.let { v -> it[email] = v }
                request.nationalId?.let { v -> it[nationalId] = v }
                request.address?.let { v -> it[address] = v }
                request.allergyNotes?.let { v -> it[allergyNotes] = v }
                request.medicalHistory?.let { v -> it[medicalHistory] = v }
                request.dentalStatus?.let { v -> it[dentalStatus] = v }
                it[updatedAt] = Instant.now()
            }

            getHealthRecordByUserId(userId)
        }
    }

    fun getAllHealthRecords(page: Int = 1, pageSize: Int = 20): PaginatedResponse<HealthRecordDTO> {
        return transaction {
            val total = HealthRecords.selectAll().count().toInt()
            val items = HealthRecords.selectAll()
                .limit(pageSize, offset = ((page - 1) * pageSize).toLong())
                .map { it.toHealthRecordDTO() }

            PaginatedResponse(
                items = items,
                total = total,
                page = page,
                pageSize = pageSize,
                totalPages = (total + pageSize - 1) / pageSize
            )
        }
    }

    fun searchHealthRecords(query: String): List<HealthRecordDTO> {
        return transaction {
            HealthRecords.select {
                (HealthRecords.fullName like "%$query%") or
                (HealthRecords.phone like "%$query%") or
                (HealthRecords.email like "%$query%")
            }.map { it.toHealthRecordDTO() }
        }
    }

    private fun ResultRow.toHealthRecordDTO() = HealthRecordDTO(
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
}
