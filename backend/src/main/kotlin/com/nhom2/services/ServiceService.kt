package com.nhom2.services

import com.nhom2.common.*
import com.nhom2.models.Services
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

object ServiceService {
    
    fun createService(request: CreateServiceRequest): ServiceDTO {
        return transaction {
            val id = Services.insert {
                it[name] = request.name
                it[description] = request.description
                it[price] = request.price
                it[duration] = request.duration
                it[category] = request.category
                it[specialtyId] = request.specialtyId?.let { UUID.fromString(it) }
                it[isActive] = true
                it[createdAt] = Instant.now()
            } get Services.id

            getServiceById(id)!!
        }
    }

    fun getServiceById(id: UUID): ServiceDTO? {
        return transaction {
            Services.select { Services.id eq id }
                .map { it.toServiceDTO() }
                .singleOrNull()
        }
    }

    fun getAllServices(activeOnly: Boolean = false): List<ServiceDTO> {
        return transaction {
            val query = if (activeOnly) {
                Services.select { Services.isActive eq true }
            } else {
                Services.selectAll()
            }
            
            query.map { it.toServiceDTO() }
        }
    }

    fun getServicesByCategory(category: String, activeOnly: Boolean = true): List<ServiceDTO> {
        return transaction {
            var query = Services.select { Services.category eq category }
            
            if (activeOnly) {
                query = query.andWhere { Services.isActive eq true }
            }
            
            query.map { it.toServiceDTO() }
        }
    }

    fun getServicesBySpecialtyId(specialtyId: String, activeOnly: Boolean = true): List<ServiceDTO> {
        return transaction {
            var query = Services.select { Services.specialtyId eq UUID.fromString(specialtyId) }
            
            if (activeOnly) {
                query = query.andWhere { Services.isActive eq true }
            }
            
            query.map { it.toServiceDTO() }
        }
    }

    fun updateService(id: UUID, request: UpdateServiceRequest): ServiceDTO? {
        return transaction {
            val exists = Services.select { Services.id eq id }.count() > 0
            if (!exists) return@transaction null

            Services.update({ Services.id eq id }) {
                request.name?.let { v -> it[name] = v }
                request.description?.let { v -> it[description] = v }
                request.price?.let { v -> it[price] = v }
                request.duration?.let { v -> it[duration] = v }
                request.category?.let { v -> it[category] = v }
                request.specialtyId?.let { v -> it[specialtyId] = UUID.fromString(v) }
                request.isActive?.let { v -> it[isActive] = v }
            }

            getServiceById(id)
        }
    }

    fun deleteService(id: UUID): Boolean {
        return transaction {
            Services.deleteWhere { Services.id eq id } > 0
        }
    }

    private fun ResultRow.toServiceDTO() = ServiceDTO(
        id = this[Services.id].toString(),
        name = this[Services.name],
        description = this[Services.description],
        price = this[Services.price].toString(),
        duration = this[Services.duration],
        category = this[Services.category],
        specialtyId = this[Services.specialtyId]?.toString(),
        isActive = this[Services.isActive],
        createdAt = this[Services.createdAt].toString(),
        updatedAt = null // Supabase doesn't have updated_at column
    )
}
