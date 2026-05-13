package com.nhom2.common

import kotlinx.serialization.Serializable

/**
 * DTOs for Supabase-compatible structure
 */

@Serializable
data class SupabaseDoctorDTO(
    val id: String,
    val userId: String?,
    val user: UserDTO?,
    val fullName: String,
    val specialty: String,  // TEXT field, not object
    val degree: String?,
    val bio: String?,
    val avatarUrl: String?,
    val isActive: Boolean,
    val createdAt: String
)

@Serializable
data class SupabaseDoctorSummaryDTO(
    val id: String,
    val fullName: String,
    val specialty: String,
    val avatarUrl: String?,
    val degree: String?
)

@Serializable
data class CreateSupabaseDoctorRequest(
    val userId: String,
    val fullName: String,
    val specialty: String,
    val degree: String?,
    val bio: String?,
    val avatarUrl: String?
)

@Serializable
data class UpdateSupabaseDoctorRequest(
    val fullName: String?,
    val specialty: String?,
    val degree: String?,
    val bio: String?,
    val avatarUrl: String?,
    val isActive: Boolean?
)

@Serializable
data class CreateDoctorWithUserRequest(
    val email: String,
    val password: String,
    val fullName: String,
    val phone: String?,
    val specialty: String,
    val degree: String?,
    val bio: String?,
    val avatarUrl: String?
)
