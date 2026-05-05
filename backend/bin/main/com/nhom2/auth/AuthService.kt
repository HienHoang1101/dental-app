package com.nhom2.auth

import at.favre.lib.crypto.bcrypt.BCrypt
import com.nhom2.common.*
import com.nhom2.config.JwtConfig
import com.nhom2.models.Users
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.*

object AuthService {
    fun register(request: RegisterRequest): LoginResponse {
        return transaction {
            // Check if user already exists
            val existingUser = Users.select { Users.email eq request.email }.singleOrNull()
            if (existingUser != null) {
                throw IllegalArgumentException("User with this email already exists")
            }

            // Hash password
            val hashedPassword = BCrypt.withDefaults().hashToString(12, request.password.toCharArray())

            // Insert user
            val userId = Users.insert {
                it[email] = request.email
                it[passwordHash] = hashedPassword
                it[fullName] = request.fullName
                it[phone] = request.phone
                it[role] = "patient"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Users.id

            // Generate JWT token
            val token = JwtConfig.generateToken(userId, "patient")

            // Get user data
            val user = getUserById(userId)!!

            LoginResponse(token = token, user = user)
        }
    }

    fun login(request: LoginRequest): LoginResponse {
        return transaction {
            // Find user by email
            val user = Users.select { Users.email eq request.email }.singleOrNull()
                ?: throw IllegalArgumentException("Invalid email or password")

            // Verify password
            val passwordHash = user[Users.passwordHash]
                ?: throw IllegalArgumentException("Invalid email or password")

            val result = BCrypt.verifyer().verify(request.password.toCharArray(), passwordHash)
            if (!result.verified) {
                throw IllegalArgumentException("Invalid email or password")
            }

            // Check if user is active
            if (!user[Users.isActive]) {
                throw IllegalArgumentException("User account is deactivated")
            }

            // Generate JWT token
            val userId = user[Users.id]
            val role = user[Users.role]
            val token = JwtConfig.generateToken(userId, role)

            // Get user data
            val userData = getUserById(userId)!!

            LoginResponse(token = token, user = userData)
        }
    }

    fun getUserById(id: UUID): UserDTO? {
        return transaction {
            Users.select { Users.id eq id }
                .map { it.toUserDTO() }
                .singleOrNull()
        }
    }

    fun getUserByEmail(email: String): UserDTO? {
        return transaction {
            Users.select { Users.email eq email }
                .map { it.toUserDTO() }
                .singleOrNull()
        }
    }

    fun createUser(request: CreateUserRequest): UserDTO {
        return transaction {
            // Check if user already exists
            val existingUser = Users.select { Users.email eq request.email }.singleOrNull()
            if (existingUser != null) {
                throw IllegalArgumentException("User with this email already exists")
            }

            // Hash password
            val hashedPassword = BCrypt.withDefaults().hashToString(12, request.password.toCharArray())

            // Insert user
            val userId = Users.insert {
                it[email] = request.email
                it[passwordHash] = hashedPassword
                it[fullName] = request.fullName
                it[phone] = request.phone
                it[role] = request.role
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Users.id

            getUserById(userId)!!
        }
    }

    fun updateUser(id: UUID, request: UpdateUserRequest): UserDTO? {
        return transaction {
            val exists = Users.select { Users.id eq id }.count() > 0
            if (!exists) return@transaction null

            Users.update({ Users.id eq id }) {
                request.fullName?.let { v -> it[fullName] = v }
                request.phone?.let { v -> it[phone] = v }
                request.isActive?.let { v -> it[isActive] = v }
                it[updatedAt] = Instant.now()
            }

            getUserById(id)
        }
    }

    fun getAllUsers(role: String? = null): List<UserDTO> {
        return transaction {
            var query = Users.selectAll()
            
            role?.let {
                query = query.andWhere { Users.role eq it }
            }

            query.map { it.toUserDTO() }
        }
    }

    fun deactivateUser(id: UUID): Boolean {
        return transaction {
            Users.update({ Users.id eq id }) {
                it[isActive] = false
                it[updatedAt] = Instant.now()
            } > 0
        }
    }

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
