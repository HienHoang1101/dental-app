package com.nhom2.doctors

import com.nhom2.common.*
import com.nhom2.models.*
import com.nhom2.specialty.SpecialtyService
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

object DoctorService {
    
    fun createDoctor(request: CreateDoctorRequest): DoctorDTO {
        return transaction {
            val id = Doctors.insert {
                it[userId] = UUID.fromString(request.userId)
                it[specialtyId] = UUID.fromString(request.specialtyId)
                it[qualifications] = request.qualifications
                it[bio] = request.bio
                it[avatar] = request.avatar
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Doctors.id

            getDoctorById(id)!!
        }
    }

    fun getDoctorById(id: UUID): DoctorDTO? {
        return transaction {
            (Doctors innerJoin Users innerJoin Specialties)
                .select { Doctors.id eq id }
                .map { it.toDoctorDTO() }
                .singleOrNull()
        }
    }

    fun getDoctorByUserId(userId: UUID): DoctorDTO? {
        return transaction {
            (Doctors innerJoin Users innerJoin Specialties)
                .select { Doctors.userId eq userId }
                .map { it.toDoctorDTO() }
                .singleOrNull()
        }
    }

    fun getAllDoctors(activeOnly: Boolean = false): List<DoctorDTO> {
        return transaction {
            val query = if (activeOnly) {
                (Doctors innerJoin Users innerJoin Specialties)
                    .select { Doctors.isActive eq true }
            } else {
                (Doctors innerJoin Users innerJoin Specialties).selectAll()
            }
            
            query.map { it.toDoctorDTO() }
        }
    }

    fun searchDoctors(filter: DoctorFilterRequest): List<DoctorDTO> {
        return transaction {
            var query = (Doctors innerJoin Users innerJoin Specialties)
                .select { Doctors.isActive eq true }

            filter.specialtyId?.let { 
                query = query.andWhere { Doctors.specialtyId eq UUID.fromString(it) }
            }

            filter.gender?.let {
                // Assuming gender is stored in Users table or HealthRecords
                // This would need adjustment based on actual schema
            }

            filter.search?.let { searchTerm ->
                query = query.andWhere { Users.fullName like "%$searchTerm%" }
            }

            query.map { it.toDoctorDTO() }
        }
    }

    fun updateDoctor(id: UUID, request: UpdateDoctorRequest): DoctorDTO? {
        return transaction {
            val exists = Doctors.select { Doctors.id eq id }.count() > 0
            if (!exists) return@transaction null

            Doctors.update({ Doctors.id eq id }) {
                request.specialtyId?.let { v -> it[specialtyId] = UUID.fromString(v) }
                request.qualifications?.let { v -> it[qualifications] = v }
                request.bio?.let { v -> it[bio] = v }
                request.avatar?.let { v -> it[avatar] = v }
                request.isActive?.let { v -> it[isActive] = v }
                it[updatedAt] = Instant.now()
            }

            getDoctorById(id)
        }
    }

    fun getDoctorSummary(id: UUID): DoctorSummaryDTO? {
        return transaction {
            (Doctors innerJoin Users innerJoin Specialties)
                .select { Doctors.id eq id }
                .map { it.toDoctorSummaryDTO() }
                .singleOrNull()
        }
    }

    private fun ResultRow.toDoctorDTO() = DoctorDTO(
        id = this[Doctors.id].toString(),
        userId = this[Doctors.userId].toString(),
        user = this.toUserDTO(),
        specialty = SpecialtyService.getSpecialtyById(this[Doctors.specialtyId])!!,
        qualifications = this[Doctors.qualifications],
        bio = this[Doctors.bio],
        avatar = this[Doctors.avatar],
        isActive = this[Doctors.isActive],
        createdAt = this[Doctors.createdAt].toString(),
        updatedAt = this[Doctors.updatedAt].toString()
    )

    private fun ResultRow.toDoctorSummaryDTO() = DoctorSummaryDTO(
        id = this[Doctors.id].toString(),
        fullName = this[Users.fullName],
        specialtyName = this[Specialties.name],
        avatar = this[Doctors.avatar],
        qualifications = this[Doctors.qualifications]
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
