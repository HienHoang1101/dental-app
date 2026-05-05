package com.nhom2.utils

import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant

/**
 * Simple migration utility that checks database structure
 */
object SimpleMigration {
    
    fun checkDatabaseStructure(): Map<String, Any> {
        return transaction {
            try {
                val result = mutableMapOf<String, Any>()
                
                // Check Users table
                val userCount = Users.selectAll().count()
                val doctorUserCount = Users.select { Users.role eq "doctor" }.count()
                result["totalUsers"] = userCount.toInt()
                result["doctorUsers"] = doctorUserCount.toInt()
                
                // Check Doctors table using Supabase structure
                val doctorCount = try {
                    SupabaseDoctors.selectAll().count()
                } catch (e: Exception) {
                    result["doctorTableError"] = e.message ?: "Unknown error"
                    0L
                }
                result["totalDoctors"] = doctorCount.toInt()
                
                // Check for users without doctor profiles
                val existingDoctorUserIds = try {
                    SupabaseDoctors.selectAll()
                        .mapNotNull { it[SupabaseDoctors.userId] }
                        .toSet()
                } catch (e: Exception) {
                    result["doctorQueryError"] = e.message ?: "Unknown error"
                    emptySet()
                }
                
                val doctorUsers = Users.select { Users.role eq "doctor" }.toList()
                val usersWithoutProfiles = doctorUsers.filter { row ->
                    row[Users.id] !in existingDoctorUserIds
                }
                
                result["usersWithoutProfiles"] = usersWithoutProfiles.size
                result["usersWithoutProfilesList"] = usersWithoutProfiles.map {
                    mapOf(
                        "id" to it[Users.id].toString(),
                        "email" to it[Users.email],
                        "fullName" to it[Users.fullName]
                    )
                }
                
                result["success"] = true
                result as Map<String, Any>
            } catch (e: Exception) {
                mapOf(
                    "success" to false,
                    "error" to (e.message ?: "Unknown error"),
                    "stackTrace" to e.stackTraceToString()
                ) as Map<String, Any>
            }
        }
    }
    
    fun createDefaultSpecialty(): Map<String, Any> {
        return mapOf(
            "success" to false,
            "message" to "This function is not needed for Supabase structure"
        ) as Map<String, Any>
    }
}
