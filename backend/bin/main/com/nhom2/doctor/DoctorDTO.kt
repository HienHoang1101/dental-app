package com.nhom2.doctor

import kotlinx.serialization.Serializable

@Serializable
data class DoctorResponse(
    val id: String,
    val userId: String? = null,
    val fullName: String,
    val specialty: String,
    val degree: String? = null,
    val bio: String? = null,
    val avatarUrl: String? = null,
    val isActive: Boolean,
    val createdAt: String
)

@Serializable
data class CreateDoctorRequest(
    val fullName: String,
    val specialty: String,
    val degree: String? = null,
    val bio: String? = null,
    val avatarUrl: String? = null
)

@Serializable
data class UpdateDoctorRequest(
    val fullName: String? = null,
    val specialty: String? = null,
    val degree: String? = null,
    val bio: String? = null,
    val avatarUrl: String? = null,
    val isActive: Boolean? = null
)