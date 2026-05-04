package com.nhom2.service

import kotlinx.serialization.Serializable

@Serializable
data class ServiceResponse(
    val id: String,
    val name: String,
    val description: String? = null,
    val price: Int,
    val durationMinutes: Int,
    val category: String? = null,
    val isActive: Boolean,
    val createdAt: String
)

@Serializable
data class CreateServiceRequest(
    val name: String,
    val description: String? = null,
    val price: Int,
    val durationMinutes: Int = 30,
    val category: String? = null
)

@Serializable
data class UpdateServiceRequest(
    val name: String? = null,
    val description: String? = null,
    val price: Int? = null,
    val durationMinutes: Int? = null,
    val category: String? = null,
    val isActive: Boolean? = null
)