package com.nhom2.patient

import com.nhom2.auth.PatientProfileTable
import com.nhom2.auth.UserTable
import org.jetbrains.exposed.sql.*
<<<<<<< HEAD
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.Instant
=======
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.LocalDateTime
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
import java.util.*

object ProfileService {

    fun getProfile(userId: String): ProfileResponse? {
        return transaction {
<<<<<<< HEAD
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
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
        }
    }

    fun updateProfile(userId: String, request: UpdateProfileRequest): ProfileResponse? {
        transaction {
<<<<<<< HEAD
            val userUUID = UUID.fromString(userId)
            
            // Update users table
            if (request.fullName != null || request.phone != null) {
                UserTable.update({ UserTable.id eq userUUID }) {
                    request.fullName?.let { name -> it[fullName] = name }
                    request.phone?.let { ph -> it[phone] = ph }
                    it[updatedAt] = Instant.now()
=======
            // Update users table
            if (request.fullName != null || request.phone != null) {
                UserTable.update({ UserTable.id eq UUID.fromString(userId) }) {
                    if (request.fullName != null) it[fullName] = request.fullName
                    if (request.phone != null) it[phone] = request.phone
                    it[updatedAt] = LocalDateTime.now()
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
                }
            }

            // Update patient_profiles table
<<<<<<< HEAD
            PatientProfileTable.update({ PatientProfileTable.userId eq userUUID }) {
                request.dateOfBirth?.let { dob -> it[dateOfBirth] = LocalDate.parse(dob) }
                request.gender?.let { g -> it[gender] = g }
                request.allergyNotes?.let { an -> it[allergyNotes] = an }
                request.medicalHistory?.let { mh -> it[medicalHistory] = mh }
                it[updatedAt] = Instant.now()
=======
            PatientProfileTable.update({ PatientProfileTable.userId eq UUID.fromString(userId) }) {
                if (request.dateOfBirth != null) it[dateOfBirth] = LocalDate.parse(request.dateOfBirth)
                if (request.gender != null) it[gender] = request.gender
                if (request.allergyNotes != null) it[allergyNotes] = request.allergyNotes
                if (request.medicalHistory != null) it[medicalHistory] = request.medicalHistory
                it[updatedAt] = LocalDateTime.now()
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
            }
        }

        return getProfile(userId)
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
