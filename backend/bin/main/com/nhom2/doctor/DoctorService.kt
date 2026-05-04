package com.nhom2.doctor

import com.nhom2.auth.UserTable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

class DoctorService {

    /**
     * Lấy danh sách bác sĩ đang hoạt động (public — cho bệnh nhân xem)
     */
    fun getActiveDoctors(): List<DoctorResponse> = transaction {
        DoctorTable
            .selectAll()
            .where { DoctorTable.isActive eq true }
            .orderBy(DoctorTable.fullName)
            .map { it.toDoctorResponse() }
    }

    /**
     * Lấy tất cả bác sĩ (admin — bao gồm cả inactive)
     */
    fun getAllDoctors(): List<DoctorResponse> = transaction {
        DoctorTable
            .selectAll()
            .orderBy(DoctorTable.createdAt, SortOrder.DESC)
            .map { it.toDoctorResponse() }
    }

    /**
     * Lấy bác sĩ theo ID
     */
    fun getDoctorById(id: UUID): DoctorResponse? = transaction {
        DoctorTable
            .selectAll()
            .where { DoctorTable.id eq id }
            .singleOrNull()
            ?.toDoctorResponse()
    }

    /**
     * Admin tạo bác sĩ mới
     * - Tạo user với role = 'doctor'
     * - Tạo bản ghi doctors liên kết
     */
    fun createDoctor(request: CreateDoctorRequest): DoctorResponse = transaction {
        // 1. Tạo user account cho bác sĩ (không có password — admin tạo)
        val doctorEmail = generateDoctorEmail(request.fullName)
        val userId = UserTable.insert {
            it[email] = doctorEmail
            it[fullName] = request.fullName
            it[role] = "doctor"
            it[isActive] = true
        } get UserTable.id

        // 2. Tạo bản ghi doctor
        val doctorId = DoctorTable.insert {
            it[DoctorTable.userId] = userId
            it[fullName] = request.fullName
            it[specialty] = request.specialty
            it[degree] = request.degree
            it[bio] = request.bio
            it[avatarUrl] = request.avatarUrl
            it[isActive] = true
        } get DoctorTable.id

        // 3. Trả về doctor vừa tạo
        getDoctorById(doctorId)!!
    }

    /**
     * Admin cập nhật thông tin bác sĩ
     */
    fun updateDoctor(id: UUID, request: UpdateDoctorRequest): DoctorResponse? = transaction {
        val updated = DoctorTable.update({ DoctorTable.id eq id }) {
            request.fullName?.let { name -> it[fullName] = name }
            request.specialty?.let { spec -> it[specialty] = spec }
            request.degree?.let { deg -> it[degree] = deg }
            request.bio?.let { b -> it[bio] = b }
            request.avatarUrl?.let { url -> it[avatarUrl] = url }
            request.isActive?.let { active -> it[isActive] = active }
        }

        if (updated > 0) {
            // Nếu có cập nhật fullName, đồng bộ sang bảng users
            request.fullName?.let { name ->
                val doctor = DoctorTable.selectAll().where { DoctorTable.id eq id }.single()
                doctor[DoctorTable.userId]?.let { uid ->
                    UserTable.update({ UserTable.id eq uid }) {
                        it[fullName] = name
                    }
                }
            }
            getDoctorById(id)
        } else {
            null
        }
    }

    /**
     * Tạo email tạm cho bác sĩ từ tên (admin tạo account, bác sĩ không tự đăng nhập v1)
     */
    private fun generateDoctorEmail(name: String): String {
        val slug = name.lowercase()
            .replace(Regex("[àáạảãâầấậẩẫăằắặẳẵ]"), "a")
            .replace(Regex("[èéẹẻẽêềếệểễ]"), "e")
            .replace(Regex("[ìíịỉĩ]"), "i")
            .replace(Regex("[òóọỏõôồốộổỗơờớợởỡ]"), "o")
            .replace(Regex("[ùúụủũưừứựửữ]"), "u")
            .replace(Regex("[ỳýỵỷỹ]"), "y")
            .replace(Regex("[đ]"), "d")
            .replace(Regex("[^a-z0-9]"), "")
        val timestamp = System.currentTimeMillis() % 10000
        return "dr.${slug}${timestamp}@nhakhoaapp.local"
    }

    private fun ResultRow.toDoctorResponse() = DoctorResponse(
        id = this[DoctorTable.id].toString(),
        userId = this[DoctorTable.userId]?.toString(),
        fullName = this[DoctorTable.fullName],
        specialty = this[DoctorTable.specialty],
        degree = this[DoctorTable.degree],
        bio = this[DoctorTable.bio],
        avatarUrl = this[DoctorTable.avatarUrl],
        isActive = this[DoctorTable.isActive],
        createdAt = this[DoctorTable.createdAt].toString()
    )
}