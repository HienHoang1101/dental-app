package com.nhom2.models

import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.StringColumnType
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.*
import org.jetbrains.exposed.sql.statements.api.PreparedStatementApi
import org.postgresql.util.PGobject
import java.time.Instant

class JsonBColumnType : StringColumnType() {
    override fun sqlType(): String = "JSONB"
    override fun setParameter(stmt: PreparedStatementApi, index: Int, value: Any?) {
        val obj = PGobject()
        obj.type = "jsonb"
        obj.value = value as String?
        stmt[index] = obj
    }
    override fun valueFromDB(value: Any): Any {
        if (value is PGobject) return value.value ?: ""
        return super.valueFromDB(value)
    }
}

fun Table.jsonb(name: String): Column<String> = registerColumn(name, JsonBColumnType())

/**
 * New tables for Weekly Scheduling V2
 */

// ── WEEKLY WORK SCHEDULES ────────────────────────
object WeeklyWorkSchedules : Table("weekly_work_schedules") {
    val id          = uuid("id").autoGenerate()
    val doctorId    = uuid("doctor_id").references(SupabaseDoctors.id)
    val dayOfWeek   = integer("day_of_week") // 1=Monday, 7=Sunday
    val session     = text("session") // morning, afternoon
    val startTime   = time("start_time")
    val endTime     = time("end_time")
    val isActive    = bool("is_active").default(true)
    val createdAt   = timestamp("created_at").clientDefault { Instant.now() }
    val updatedAt   = timestamp("updated_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── SCHEDULE EXCEPTIONS ──────────────────────────
object ScheduleExceptions : Table("schedule_exceptions") {
    val id                = uuid("id").autoGenerate()
    val doctorId          = uuid("doctor_id").references(SupabaseDoctors.id)
    val exceptionDate     = date("exception_date")
    val session           = text("session").nullable() // morning, afternoon, or null for full day
    val exceptionType     = text("exception_type") // off, override
    val overrideStartTime = time("override_start_time").nullable()
    val overrideEndTime   = time("override_end_time").nullable()
    val reason            = text("reason").nullable()
    val createdAt         = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── SCHEDULE CHANGE REQUESTS ─────────────────────
object ScheduleChangeRequests : Table("schedule_change_requests") {
    val id              = uuid("id").autoGenerate()
    val doctorId        = uuid("doctor_id").references(SupabaseDoctors.id)
    val requestType     = text("request_type") // add, remove, modify
    val oldScheduleData = jsonb("old_schedule_data").nullable() // JSON string
    val newScheduleData = jsonb("new_schedule_data").nullable() // JSON string
    val status          = text("status").default("pending") // pending, approved, rejected
    val rejectionReason = text("rejection_reason").nullable()
    val reviewedBy      = uuid("reviewed_by").references(Users.id).nullable()
    val reviewedAt      = timestamp("reviewed_at").nullable()
    val createdAt       = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}
