package com.nhom2.patient

import kotlinx.serialization.Serializable

@Serializable
data class ProfileResponse(
    val userId: String,
    val fullName: String,
    val email: String,
    val phone: String?,
    val dateOfBirth: String?,
    val gender: String?,
    val allergyNotes: String?,
    val medicalHistory: String?
)

@Serializable
data class UpdateProfileRequest(
    val fullName: String? = null,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val allergyNotes: String? = null,
    val medicalHistory: String? = null
)