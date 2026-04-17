package com.nhom2.auth

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.datetime

object PatientProfileTable : Table("patient_profiles") {
    val id = uuid("id").autoGenerate()
    val userId = uuid("user_id").references(UserTable.id)
    val dateOfBirth = date("date_of_birth").nullable()
    val gender = text("gender").nullable()
    val allergyNotes = text("allergy_notes").nullable()
    val medicalHistory = text("medical_history").nullable()
    val updatedAt = datetime("updated_at")

    override val primaryKey = PrimaryKey(id)
}