package com.nhom2.specialty

import com.nhom2.common.*
import com.nhom2.models.Specialties
import com.nhom2.models.Doctors
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

object SpecialtyService {
    
    fun createSpecialty(request: CreateSpecialtyRequest): SpecialtyDTO {
        return transaction {
            val id = Specialties.insert {
                it[name] = request.name
                it[description] = request.description
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Specialties.id

            getSpecialtyById(id)!!
        }
    }

    fun getSpecialtyById(id: UUID): SpecialtyDTO? {
        return transaction {
            Specialties.select { Specialties.id eq id }
                .map { it.toSpecialtyDTO() }
                .singleOrNull()
        }
    }

    fun getAllSpecialties(activeOnly: Boolean = false): List<SpecialtyDTO> {
        return transaction {
            val query = if (activeOnly) {
                Specialties.select { Specialties.isActive eq true }
            } else {
                Specialties.selectAll()
            }
            
            query.map { it.toSpecialtyDTO() }
        }
    }

    fun updateSpecialty(id: UUID, request: UpdateSpecialtyRequest): SpecialtyDTO? {
        return transaction {
            val exists = Specialties.select { Specialties.id eq id }.count() > 0
            if (!exists) return@transaction null

            Specialties.update({ Specialties.id eq id }) {
                request.name?.let { v -> it[name] = v }
                request.description?.let { v -> it[description] = v }
                request.isActive?.let { v -> it[isActive] = v }
                it[updatedAt] = Instant.now()
            }

            getSpecialtyById(id)
        }
    }

    fun deleteSpecialty(id: UUID): Boolean {
        return transaction {
            Specialties.deleteWhere { Specialties.id eq id } > 0
        }
    }

    private fun ResultRow.toSpecialtyDTO(): SpecialtyDTO {
        val specialtyId = this[Specialties.id]
        val doctorCount = Doctors.select { Doctors.specialtyId eq specialtyId }.count().toInt()
        
        return SpecialtyDTO(
            id = specialtyId.toString(),
            name = this[Specialties.name],
            description = this[Specialties.description],
            isActive = this[Specialties.isActive],
            doctorCount = doctorCount,
            createdAt = this[Specialties.createdAt].toString(),
            updatedAt = this[Specialties.updatedAt].toString()
        )
    }
}
