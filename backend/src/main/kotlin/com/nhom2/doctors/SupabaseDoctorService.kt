package com.nhom2.doctors

import com.nhom2.common.*
import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

/**
 * Doctor service using Supabase-compatible table structure
 */
object SupabaseDoctorService {
    
    fun getAllDoctors(activeOnly: Boolean = false): List<SupabaseDoctorDTO> {
        return transaction {
            try {
                val query = if (activeOnly) {
                    (SupabaseDoctors leftJoin Users)
                        .select { SupabaseDoctors.isActive eq true }
                } else {
                    (SupabaseDoctors leftJoin Users).selectAll()
                }
                
                query.map { it.toSupabaseDoctorDTO() }
            } catch (e: Exception) {
                emptyList()
            }
        }
    }

    fun getDoctorsBySpecialtyId(specialtyId: String, activeOnly: Boolean = false): List<SupabaseDoctorDTO> {
        return transaction {
            try {
                // First, get the specialty name from the specialties table
                val specialtyName = Specialties
                    .select { Specialties.id eq UUID.fromString(specialtyId) }
                    .singleOrNull()
                    ?.get(Specialties.name)
                    ?: return@transaction emptyList()
                
                // Then filter doctors by specialty name
                val query = if (activeOnly) {
                    (SupabaseDoctors leftJoin Users)
                        .select { 
                            (SupabaseDoctors.isActive eq true) and 
                            (SupabaseDoctors.specialty eq specialtyName)
                        }
                } else {
                    (SupabaseDoctors leftJoin Users)
                        .select { SupabaseDoctors.specialty eq specialtyName }
                }
                
                query.map { it.toSupabaseDoctorDTO() }
            } catch (e: Exception) {
                emptyList()
            }
        }
    }

    fun getDoctorById(id: UUID): SupabaseDoctorDTO? {
        return transaction {
            (SupabaseDoctors leftJoin Users)
                .select { SupabaseDoctors.id eq id }
                .map { it.toSupabaseDoctorDTO() }
                .singleOrNull()
        }
    }

    fun getDoctorByUserId(userId: UUID): SupabaseDoctorDTO? {
        return transaction {
            (SupabaseDoctors leftJoin Users)
                .select { SupabaseDoctors.userId eq userId }
                .map { it.toSupabaseDoctorDTO() }
                .singleOrNull()
        }
    }

    fun createDoctor(request: CreateSupabaseDoctorRequest): SupabaseDoctorDTO {
        return transaction {
            val id = SupabaseDoctors.insert {
                it[userId] = UUID.fromString(request.userId)
                it[fullName] = request.fullName
                it[specialty] = request.specialty
                it[degree] = request.degree
                it[bio] = request.bio
                it[avatarUrl] = request.avatarUrl
                it[isActive] = true
                it[createdAt] = Instant.now()
            } get SupabaseDoctors.id

            getDoctorById(id)!!
        }
    }

    fun updateDoctor(id: UUID, request: UpdateSupabaseDoctorRequest): SupabaseDoctorDTO? {
        return transaction {
            val exists = SupabaseDoctors.select { SupabaseDoctors.id eq id }.count() > 0
            if (!exists) return@transaction null

            SupabaseDoctors.update({ SupabaseDoctors.id eq id }) {
                request.fullName?.let { v -> it[fullName] = v }
                request.specialty?.let { v -> it[specialty] = v }
                request.degree?.let { v -> it[degree] = v }
                request.bio?.let { v -> it[bio] = v }
                request.avatarUrl?.let { v -> it[avatarUrl] = v }
                request.isActive?.let { v -> it[isActive] = v }
            }

            getDoctorById(id)
        }
    }

    fun deleteDoctor(id: UUID): Boolean {
        return transaction {
            // Soft delete - just deactivate
            SupabaseDoctors.update({ SupabaseDoctors.id eq id }) {
                it[isActive] = false
            } > 0
        }
    }

    fun getDoctorSummary(id: UUID): DoctorSummaryDTO? {
        return transaction {
            SupabaseDoctors.select { SupabaseDoctors.id eq id }
                .singleOrNull()
                ?.toDoctorSummaryDTO()
        }
    }

    private fun ResultRow.toDoctorSummaryDTO() = DoctorSummaryDTO(
        id = this[SupabaseDoctors.id].toString(),
        fullName = this[SupabaseDoctors.fullName],
        specialtyName = this[SupabaseDoctors.specialty],
        avatar = this[SupabaseDoctors.avatarUrl],
        qualifications = this[SupabaseDoctors.degree]
    )

    private fun ResultRow.toSupabaseDoctorDTO() = SupabaseDoctorDTO(
        id = this[SupabaseDoctors.id].toString(),
        userId = this[SupabaseDoctors.userId]?.toString(),
        user = if (this.hasValue(Users.id)) this.toUserDTO() else null,
        fullName = this[SupabaseDoctors.fullName],
        specialty = this[SupabaseDoctors.specialty],
        degree = this[SupabaseDoctors.degree],
        bio = this[SupabaseDoctors.bio],
        avatarUrl = this[SupabaseDoctors.avatarUrl],
        isActive = this[SupabaseDoctors.isActive],
        createdAt = this[SupabaseDoctors.createdAt].toString()
    )

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
