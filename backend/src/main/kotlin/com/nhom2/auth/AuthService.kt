package com.nhom2.auth

import at.favre.lib.crypto.bcrypt.BCrypt
import com.nhom2.config.JwtConfig
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.util.*

object AuthService {

    fun register(request: RegisterRequest): AuthResponse {
        // Check email exists
        val existing = transaction {
            UserTable.selectAll().where { UserTable.email eq request.email }.firstOrNull()
        }
        if (existing != null) {
            throw IllegalArgumentException("Email đã được đăng ký")
        }

        // Hash password
        val hashedPassword = BCrypt.withDefaults().hashToString(12, request.password.toCharArray())

        // Insert user + patient_profile
        val userId = transaction {
            val newUserId = UserTable.insert {
                it[email] = request.email
                it[passwordHash] = hashedPassword
                it[fullName] = request.fullName
                it[phone] = request.phone
                it[role] = "patient"
                it[isActive] = true
                it[createdAt] = LocalDateTime.now()
                it[updatedAt] = LocalDateTime.now()
            } get UserTable.id

            PatientProfileTable.insert {
                it[PatientProfileTable.userId] = newUserId
                it[updatedAt] = LocalDateTime.now()
            }

            newUserId
        }

        val token = JwtConfig.generateToken(userId, "patient")

        return AuthResponse(
            accessToken = token,
            user = UserResponse(
                id = userId.toString(),
                email = request.email,
                fullName = request.fullName,
                phone = request.phone,
                role = "patient"
            )
        )
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = transaction {
            UserTable.selectAll().where { UserTable.email eq request.email }.firstOrNull()
        } ?: throw IllegalArgumentException("Sai email hoặc mật khẩu")

        val storedHash = user[UserTable.passwordHash]
            ?: throw IllegalArgumentException("Tài khoản này sử dụng Google đăng nhập")

        val result = BCrypt.verifyer().verify(request.password.toCharArray(), storedHash)
        if (!result.verified) {
            throw IllegalArgumentException("Sai email hoặc mật khẩu")
        }

        val userId = user[UserTable.id]
        val role = user[UserTable.role]
        val token = JwtConfig.generateToken(userId, role)

        return AuthResponse(
            accessToken = token,
            user = UserResponse(
                id = userId.toString(),
                email = user[UserTable.email],
                fullName = user[UserTable.fullName],
                phone = user[UserTable.phone],
                role = role
            )
        )
    }

    fun getUserById(userId: String): UserResponse? {
        return transaction {
            UserTable.selectAll().where { UserTable.id eq UUID.fromString(userId) }.firstOrNull()?.let {
                UserResponse(
                    id = it[UserTable.id].toString(),
                    email = it[UserTable.email],
                    fullName = it[UserTable.fullName],
                    phone = it[UserTable.phone],
                    role = it[UserTable.role]
                )
            }
        }
    }
}