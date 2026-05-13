package com.nhom2.patient

import com.nhom2.auth.PatientProfileTable
import com.nhom2.auth.UserTable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.Instant
import java.util.*

object ProfileService {

    fun getProfile(userId: String): ProfileResponse? {
        return transaction {
            val userUUID = UUID.fromString(userId)
            val result = (UserTable innerJoin PatientProfileTable)
                .select { UserTable.id eq userUUID }
                .firstOrNull()
            
            result?.let { row ->
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
            val userUUID = UUID.fromString(userId)
            
            // Update users table
            if (request.fullName != null || request.phone != null) {
                UserTable.update({ UserTable.id eq userUUID }) {
                    request.fullName?.let { name -> it[fullName] = name }
                    request.phone?.let { ph -> it[phone] = ph }
                    it[updatedAt] = Instant.now()
                }
            }

            // Update patient_profiles table
            PatientProfileTable.update({ PatientProfileTable.userId eq userUUID }) {
                request.dateOfBirth?.let { dob -> it[dateOfBirth] = LocalDate.parse(dob) }
                request.gender?.let { g -> it[gender] = g }
                request.allergyNotes?.let { an -> it[allergyNotes] = an }
                request.medicalHistory?.let { mh -> it[medicalHistory] = mh }
                it[updatedAt] = Instant.now()
            }
        }

        return getProfile(userId)
    }
}
