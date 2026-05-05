package com.nhom2.models

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.*
import java.time.Instant

/**
 * Supabase-compatible table definitions
 * These match the actual Supabase schema structure
 */

// Supabase doctors table structure
object SupabaseDoctors : Table("doctors") {
    val id           = uuid("id").autoGenerate()
    val userId       = uuid("user_id").uniqueIndex().references(Users.id).nullable()
    val fullName     = text("full_name")
    val specialty    = text("specialty")  // TEXT, not UUID!
    val degree       = text("degree").nullable()
    val bio          = text("bio").nullable()
    val avatarUrl    = text("avatar_url").nullable()
    val isActive     = bool("is_active").default(true)
    val createdAt    = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// Supabase patient_profiles table
object PatientProfiles : Table("patient_profiles") {
    val id             = uuid("id").autoGenerate()
    val userId         = uuid("user_id").uniqueIndex().references(Users.id)
    val dateOfBirth    = date("date_of_birth").nullable()
    val gender         = text("gender").nullable()
    val allergyNotes   = text("allergy_notes").nullable()
    val medicalHistory = text("medical_history").nullable()
    val updatedAt      = timestamp("updated_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// Supabase doctor_schedules table
object DoctorSchedules : Table("doctor_schedules") {
    val id         = uuid("id").autoGenerate()
    val doctorId   = uuid("doctor_id").references(SupabaseDoctors.id)
    val workDate   = date("work_date")
    val slotStart  = time("slot_start")
    val slotEnd    = time("slot_end")
    val isBooked   = bool("is_booked").default(false)
    val createdAt  = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}
