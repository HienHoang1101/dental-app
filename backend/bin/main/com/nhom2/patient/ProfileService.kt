package com.nhom2.patient

import com.nhom2.auth.PatientProfileTable
import com.nhom2.auth.UserTable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

object ProfileService {

    fun getProfile(userId: String): ProfileResponse? {
        return transaction {
            (UserTable innerJoin PatientProfileTable)
                .selectAll()
                .where { UserTable.id eq UUID.fromString(userId) }
                .firstOrNull()
                ?.let { row ->
                    ProfileResponse(
                        userId = row[UserTable.id].toString(),
                        fullName = row[UserTable.fullName],
                        email = row[UserTable.email],
                        phone = row[UserTable.phone],
                        dateOfBirth = row[PatientProfileTable.dateOfBirth]?.toString(),
                        gender = row[PatientProfileTable.gender],
                        allergyNotes = row[PatientProfileTable.allergyNotes],
                        medicalHistory = row[PatientProfileTable.medicalHistory]
                    )
                }
        }
    }

    fun updateProfile(userId: String, request: UpdateProfileRequest): ProfileResponse? {
        transaction {
            // Update users table
            if (request.fullName != null || request.phone != null) {
                UserTable.update({ UserTable.id eq UUID.fromString(userId) }) {
                    if (request.fullName != null) it[fullName] = request.fullName
                    if (request.phone != null) it[phone] = request.phone
                    it[updatedAt] = LocalDateTime.now()
                }
            }

            // Update patient_profiles table
            PatientProfileTable.update({ PatientProfileTable.userId eq UUID.fromString(userId) }) {
                if (request.dateOfBirth != null) it[dateOfBirth] = LocalDate.parse(request.dateOfBirth)
                if (request.gender != null) it[gender] = request.gender
                if (request.allergyNotes != null) it[allergyNotes] = request.allergyNotes
                if (request.medicalHistory != null) it[medicalHistory] = request.medicalHistory
                it[updatedAt] = LocalDateTime.now()
            }
        }

        return getProfile(userId)
    }
}