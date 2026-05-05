package com.nhom2.utils

import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant

/**
 * Utility to create doctor profiles for users with role "doctor" who don't have a doctor profile yet
 * Uses Supabase-compatible table structure
 */
object MigrateDoctors {
    
    fun createMissingDoctorProfiles(): Map<String, Any> {
        return transaction {
            try {
                println("=== Starting Doctor Migration (Supabase) ===")
                
                // Get all users with role "doctor"
                val doctorUsers = Users.select { Users.role eq "doctor" }.toList()
                println("Found ${doctorUsers.size} users with role 'doctor'")
                
                // Get all existing doctor profiles
                val existingDoctorUserIds = SupabaseDoctors.selectAll()
                    .mapNotNull { it[SupabaseDoctors.userId] }
                    .toSet()
                println("Found ${existingDoctorUserIds.size} existing doctor profiles")
                
                // Find users without doctor profiles
                val usersWithoutProfiles = doctorUsers.filter { row ->
                    row[Users.id] !in existingDoctorUserIds
                }
                
                if (usersWithoutProfiles.isEmpty()) {
                    println("All doctor users already have profiles!")
                    return@transaction mapOf(
                        "success" to true,
                        "message" to "All doctor users already have profiles",
                        "created" to 0,
                        "total" to doctorUsers.size
                    )
                }
                
                println("Found ${usersWithoutProfiles.size} doctor users without profiles")
                
                // Create doctor profiles
                var successCount = 0
                val errors = mutableListOf<String>()
                
                usersWithoutProfiles.forEach { userRow ->
                    val userId = userRow[Users.id]
                    val fullName = userRow[Users.fullName]
                    
                    try {
                        val doctorId = SupabaseDoctors.insert {
                            it[SupabaseDoctors.userId] = userId
                            it[SupabaseDoctors.fullName] = fullName
                            it[specialty] = "General Dentistry"  // TEXT field
                            it[degree] = "DDS"
                            it[bio] = "Dental professional"
                            it[avatarUrl] = null
                            it[isActive] = true
                            it[createdAt] = Instant.now()
                        } get SupabaseDoctors.id
                        
                        println("✓ Created doctor profile for: $fullName (user_id: $userId, doctor_id: $doctorId)")
                        successCount++
                    } catch (e: Exception) {
                        val errorMsg = "Failed to create doctor profile for: $fullName (user_id: $userId) - ${e.message}"
                        println("✗ $errorMsg")
                        e.printStackTrace()
                        errors.add(errorMsg)
                    }
                }
                
                println("\n=== Migration Complete ===")
                println("Created: $successCount")
                println("Failed: ${errors.size}")
                
                mapOf(
                    "success" to true,
                    "message" to "Migration completed",
                    "created" to successCount,
                    "failed" to errors.size,
                    "total" to usersWithoutProfiles.size,
                    "errors" to errors
                )
            } catch (e: Exception) {
                println("=== Migration Failed ===")
                println("Error: ${e.message}")
                e.printStackTrace()
                throw e
            }
        }
    }
}
