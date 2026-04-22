package com.nhom2.service

import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

class ServiceService {

    /**
     * Lấy danh sách dịch vụ đang hoạt động (public — cho bệnh nhân xem)
     */
    fun getActiveServices(): List<ServiceResponse> = transaction {
        ServiceTable
            .selectAll()
            .where { ServiceTable.isActive eq true }
            .orderBy(ServiceTable.category, SortOrder.ASC_NULLS_LAST)
            .orderBy(ServiceTable.name)
            .map { it.toServiceResponse() }
    }

    /**
     * Lấy tất cả dịch vụ (admin — bao gồm cả inactive)
     */
    fun getAllServices(): List<ServiceResponse> = transaction {
        ServiceTable
            .selectAll()
            .orderBy(ServiceTable.createdAt, SortOrder.DESC)
            .map { it.toServiceResponse() }
    }

    /**
     * Lấy dịch vụ theo ID
     */
    fun getServiceById(id: UUID): ServiceResponse? = transaction {
        ServiceTable
            .selectAll()
            .where { ServiceTable.id eq id }
            .singleOrNull()
            ?.toServiceResponse()
    }

    /**
     * Admin thêm dịch vụ mới
     */
    fun createService(request: CreateServiceRequest): ServiceResponse = transaction {
        val serviceId = ServiceTable.insert {
            it[name] = request.name
            it[description] = request.description
            it[price] = request.price
            it[durationMinutes] = request.durationMinutes
            it[category] = request.category
            it[isActive] = true
        } get ServiceTable.id

        getServiceById(serviceId)!!
    }

    /**
     * Admin cập nhật dịch vụ
     * Lưu ý: thay đổi giá không ảnh hưởng lịch hẹn đã đặt trước đó
     */
    fun updateService(id: UUID, request: UpdateServiceRequest): ServiceResponse? = transaction {
        val updated = ServiceTable.update({ ServiceTable.id eq id }) {
            request.name?.let { n -> it[name] = n }
            request.description?.let { d -> it[description] = d }
            request.price?.let { p -> it[price] = p }
            request.durationMinutes?.let { dm -> it[durationMinutes] = dm }
            request.category?.let { c -> it[category] = c }
            request.isActive?.let { a -> it[isActive] = a }
        }

        if (updated > 0) getServiceById(id) else null
    }

    private fun ResultRow.toServiceResponse() = ServiceResponse(
        id = this[ServiceTable.id].toString(),
        name = this[ServiceTable.name],
        description = this[ServiceTable.description],
        price = this[ServiceTable.price],
        durationMinutes = this[ServiceTable.durationMinutes],
        category = this[ServiceTable.category],
        isActive = this[ServiceTable.isActive],
        createdAt = this[ServiceTable.createdAt].toString()
    )
}