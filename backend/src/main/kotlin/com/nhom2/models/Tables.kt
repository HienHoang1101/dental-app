package com.nhom2.models

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.*
import java.time.Instant

// ── USERS ────────────────────────────────────────
object Users : Table("users") {
    val id           = uuid("id").autoGenerate()
    val email        = text("email").uniqueIndex()
    val passwordHash = text("password_hash").nullable()
    val fullName     = text("full_name")
    val phone        = text("phone").nullable()
    val role         = text("role").default("patient") // patient, doctor, admin
    val isActive     = bool("is_active").default(true)
    val createdAt    = timestamp("created_at").clientDefault { Instant.now() }
    val updatedAt    = timestamp("updated_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── HEALTH RECORDS (Patient Profiles) ────────────
object HealthRecords : Table("health_records") {
    val id             = uuid("id").autoGenerate()
    val userId         = uuid("user_id").uniqueIndex().references(Users.id)
    val fullName       = text("full_name")
    val dateOfBirth    = date("date_of_birth")
    val ethnicity      = text("ethnicity").nullable()
    val gender         = text("gender")
    val occupation     = text("occupation").nullable()
    val phone          = text("phone")
    val email          = text("email")
    val nationalId     = text("national_id").nullable()
    val address        = text("address")
    val allergyNotes   = text("allergy_notes").nullable()
    val medicalHistory = text("medical_history").nullable()
    val dentalStatus   = text("dental_status").nullable()
    val createdAt      = timestamp("created_at").clientDefault { Instant.now() }
    val updatedAt      = timestamp("updated_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── SPECIALTIES ──────────────────────────────────
object Specialties : Table("specialties") {
    val id          = uuid("id").autoGenerate()
    val name        = text("name").uniqueIndex()
    val description = text("description").nullable()
    val isActive    = bool("is_active").default(true)
    val createdAt   = timestamp("created_at").clientDefault { Instant.now() }
    val updatedAt   = timestamp("updated_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── DOCTORS ──────────────────────────────────────
// DEPRECATED: Use SupabaseDoctors instead (defined in SupabaseTables.kt)
// This table definition doesn't match the actual Supabase schema
/*
object Doctors : Table("doctors") {
    val id            = uuid("id").autoGenerate()
    val userId        = uuid("user_id").uniqueIndex().references(Users.id)
    val specialtyId   = uuid("specialty_id").references(Specialties.id)
    val qualifications = text("qualifications").nullable()
    val bio           = text("bio").nullable()
    val avatar        = text("avatar").nullable()
    val isActive      = bool("is_active").default(true)
    val createdAt     = timestamp("created_at").clientDefault { Instant.now() }
    val updatedAt     = timestamp("updated_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}
*/

// ── SERVICES ─────────────────────────────────────
object Services : Table("services") {
    val id          = uuid("id").autoGenerate()
    val name        = text("name")
    val description = text("description").nullable()
    val price       = integer("price") // stored as integer in Supabase
    val duration    = integer("duration_minutes") // column name in Supabase
    val category    = text("category").nullable()
    val specialtyId = uuid("specialty_id").references(Specialties.id).nullable()
    val isActive    = bool("is_active").default(true)
    val createdAt   = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── HOLIDAYS ─────────────────────────────────────
object Holidays : Table("holidays") {
    val id          = uuid("id").autoGenerate()
    val date        = date("date").uniqueIndex()
    val name        = text("name")
    val description = text("description").nullable()
    val createdAt   = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── SHIFTS ───────────────────────────────────────
object Shifts : Table("shifts") {
    val id        = uuid("id").autoGenerate()
    val name      = text("name") // Morning, Afternoon, Evening
    val startTime = time("start_time")
    val endTime   = time("end_time")
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── WORK SCHEDULES ───────────────────────────────
object WorkSchedules : Table("work_schedules") {
    val id                 = uuid("id").autoGenerate()
    val doctorId           = uuid("doctor_id").references(SupabaseDoctors.id)
    val shiftId            = uuid("shift_id").references(Shifts.id)
    val date               = date("date")
    val slotDuration       = integer("slot_duration").default(30) // minutes
    val maxPatientPerSlot  = integer("max_patient_per_slot").default(1)
    val createdAt          = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
    init {
        uniqueIndex(doctorId, shiftId, date)
    }
}

// ── TIME SLOTS ───────────────────────────────────
object TimeSlots : Table("time_slots") {
    val id                = uuid("id").autoGenerate()
    val workScheduleId    = uuid("work_schedule_id").references(WorkSchedules.id)
    val startTime         = time("start_time")
    val endTime           = time("end_time")
    val maxPatientPerSlot = integer("max_patient_per_slot").default(1)
    val createdAt         = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── APPOINTMENTS ─────────────────────────────────
object Appointments : Table("appointments") {
    val id              = uuid("id").autoGenerate()
    val patientId       = uuid("patient_id").references(Users.id)
    val doctorId        = uuid("doctor_id").references(SupabaseDoctors.id)
    val healthRecordId  = uuid("health_record_id").references(HealthRecords.id)
    val scheduleId      = uuid("schedule_id").references(DoctorSchedules.id).nullable() // Nullable for backward compatibility
    val timeSlotId      = uuid("time_slot_id").references(TimeSlots.id)
    val serviceId       = uuid("service_id").references(Services.id).nullable()
    val appointmentDate = date("appointment_date")
    val status          = text("status").default("pending") // pending, confirmed, completed, cancelled
    val notes           = text("notes").nullable()
    val cancellationReason = text("cancellation_reason").nullable()
    val createdAt       = timestamp("created_at").clientDefault { Instant.now() }
    val updatedAt       = timestamp("updated_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── LEAVE REQUESTS ───────────────────────────────
object LeaveRequests : Table("leave_requests") {
    val id          = uuid("id").autoGenerate()
    val doctorId    = uuid("doctor_id").references(SupabaseDoctors.id)
    val startDate   = date("start_date")
    val endDate     = date("end_date")
    val reason      = text("reason")
    val status      = text("status").default("pending") // pending, approved, rejected
    val reviewedBy  = uuid("reviewed_by").references(Users.id).nullable()
    val reviewedAt  = timestamp("reviewed_at").nullable()
    val createdAt   = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── NOTIFICATIONS ────────────────────────────────
object Notifications : Table("notifications") {
    val id        = uuid("id").autoGenerate()
    val userId    = uuid("user_id").references(Users.id)
    val title     = text("title")
    val message   = text("message")
    val type      = text("type") // appointment_confirmed, appointment_cancelled, etc.
    val isRead    = bool("is_read").default(false)
    val relatedId = uuid("related_id").nullable() // appointment_id, etc.
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}
