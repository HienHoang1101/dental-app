package com.nhom2.utils

import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import com.nhom2.models.*
import java.util.UUID

object SimpleMigration {

    fun checkDatabaseStructure(): Map<String, Any> {
        return transaction {
            val tables = listOf("users", "doctors", "specialties", "appointments", "weekly_work_schedules")
            val results = mutableMapOf<String, Any>()
            
            for (table in tables) {
                try {
                    exec("SELECT count(*) FROM $table") { rs ->
                        if (rs.next()) {
                            results[table] = rs.getLong(1)
                        }
                    }
                } catch (e: Exception) {
                    results[table] = "Error: ${e.message}"
                }
            }
            results
        }
    }

    fun createDefaultSpecialty(): String {
        return transaction {
            val exists = Specialties.select { Specialties.name eq "Nha khoa Tổng quát" }.count() > 0
            if (!exists) {
                Specialties.insert {
                    it[name] = "Nha khoa Tổng quát"
                    it[description] = "Dịch vụ nha khoa cơ bản"
                }
                "Created default specialty"
            } else {
                "Default specialty already exists"
            }
        }
    }

    fun fixAppointmentsSchema(): String {
        return transaction {
            try {
                // 1. Make schedule_id nullable if it exists
                exec("ALTER TABLE appointments ALTER COLUMN schedule_id DROP NOT NULL")
                
                // 2. Make appointment_date nullable if it exists (for V2 bookings)
                // Actually, V2 bookings still use appointment_date, but maybe it was NOT NULL and missing in some requests?
                // The error was about schedule_id primarily.
                exec("ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL")
                
                "Schema fix executed successfully"
            } catch (e: Exception) {
                "Schema fix failed or already applied: ${e.message}"
            }
        }
    }
}
