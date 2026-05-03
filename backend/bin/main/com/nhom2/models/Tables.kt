package com.nhom2.models

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.*

// ── USERS ────────────────────────────────────────
object Users : Table("users") {
    val id           = uuid("id").autoGenerate()
    val email        = text("email").uniqueIndex()
    val passwordHash = text("password_hash").nullable()
    val fullName     = text("full_name")
    val phone        = text("phone").nullable()
    val role         = text("role").default("patient")
    val isActive     = bool("is_active").default(true)
    // Do not set defaultExpression here to avoid Exposed type mismatches across versions.
    // The database can provide defaults (e.g. DEFAULT now()) or application can set values on insert/update.
    val createdAt    = timestampWithTimeZone("created_at")
    val updatedAt    = timestampWithTimeZone("updated_at")

    override val primaryKey = PrimaryKey(id)
}

// ── PATIENT PROFILES ─────────────────────────────
object PatientProfiles : Table("patient_profiles") {
    val id             = uuid("id").autoGenerate()
    val userId         = uuid("user_id").uniqueIndex()
                            .references(Users.id)
    val dateOfBirth    = date("date_of_birth").nullable()
    val gender         = text("gender").nullable()
    val allergyNotes   = text("allergy_notes").nullable()
    val medicalHistory = text("medical_history").nullable()
    val updatedAt      = timestampWithTimeZone("updated_at")

    override val primaryKey = PrimaryKey(id)
}
