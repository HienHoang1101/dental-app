package com.nhom2.auth

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
<<<<<<< HEAD
import org.jetbrains.exposed.sql.javatime.timestamp
=======
import org.jetbrains.exposed.sql.javatime.datetime
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

object PatientProfileTable : Table("patient_profiles") {
    val id = uuid("id").autoGenerate()
    val userId = uuid("user_id").references(UserTable.id)
    val dateOfBirth = date("date_of_birth").nullable()
    val gender = text("gender").nullable()
    val allergyNotes = text("allergy_notes").nullable()
    val medicalHistory = text("medical_history").nullable()
<<<<<<< HEAD
    val updatedAt = timestamp("updated_at")
=======
    val updatedAt = datetime("updated_at")
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

    override val primaryKey = PrimaryKey(id)
}