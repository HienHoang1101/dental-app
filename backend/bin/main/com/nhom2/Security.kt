package com.nhom2

import com.nhom2.models.SupabaseDoctors
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

/**
 * Security utility functions
 */
object Security {
    
    /**
     * Get doctor ID from user ID
     * Returns null if user is not a doctor
     */
    fun getDoctorIdByUserId(userId: UUID): UUID? {
        return transaction {
            SupabaseDoctors.select { SupabaseDoctors.userId eq userId }
                .singleOrNull()
                ?.get(SupabaseDoctors.id)
        }
    }
}
