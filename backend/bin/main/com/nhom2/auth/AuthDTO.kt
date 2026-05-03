package com.nhom2.auth

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val fullName: String,
    val phone: String? = null
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class UserResponse(
    val id: String,
    val email: String,
    val fullName: String,
    val phone: String?,
    val role: String
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long = 86400,
    val user: UserResponse
)

@Serializable
data class ErrorResponse(
    val error: String
)