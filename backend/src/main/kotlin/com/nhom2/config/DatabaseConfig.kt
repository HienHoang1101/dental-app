package com.nhom2.config

import io.github.cdimascio.dotenv.dotenv
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import com.nhom2.models.*

object DatabaseConfig {
    fun init() {
        // Load .env safely
        val dot = try {
            dotenv { ignoreIfMissing = true }
        } catch (t: Throwable) {
            println("⚠️ Warning: Failed to load .env file: ${t.message}")
            null
        }

        // Fallback parser for duplicate keys
        val fallbackMap: Map<String, String> = run {
            try {
                val f = java.io.File(".env")
                if (!f.exists()) emptyMap() else f.readLines()
                    .mapNotNull { line ->
                        val trimmed = line.trim()
                        if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) return@mapNotNull null
                        val idx = trimmed.indexOf('=')
                        val key = trimmed.substring(0, idx).trim()
                        val value = trimmed.substring(idx + 1).trim()
                        key to value
                    }
                    .fold(mutableMapOf<String, String>()) { acc, (k, v) -> acc.apply { this[k] = v } }
            } catch (t: Throwable) {
                println("⚠️ Warning: Failed to parse .env file: ${t.message}")
                emptyMap<String, String>()
            }
        }

        fun envGet(key: String): String? = dot?.get(key) ?: fallbackMap[key] ?: System.getenv(key)

        val dbUrl = envGet("DATABASE_URL") ?: error("DATABASE_URL is not set")
        val dbUser = envGet("DATABASE_USER") ?: error("DATABASE_USER is not set")
        val dbPassword = envGet("DATABASE_PASSWORD") ?: ""
        
        // DEBUG: Print connection info
        println("🔗 Connecting to: $dbUrl")
        println("👤 User: $dbUser")

        // Auto-detect driver based on URL
        val driver = when {
            dbUrl.contains("h2") -> "org.h2.Driver"
            dbUrl.contains("postgresql") -> "org.postgresql.Driver"
            else -> "org.postgresql.Driver"
        }
        println("🚗 Using driver: $driver")

        Database.connect(
            url = dbUrl,
            driver = driver,
            user = dbUser,
            password = dbPassword
        )
        println("✅ Database connected successfully")

        // Create tables for H2, skip for PostgreSQL/Supabase
        if (dbUrl.contains("h2")) {
            try {
                transaction {
                    SchemaUtils.create(
                        Users,
                        HealthRecords,
                        Specialties,
                        // Doctors, // DEPRECATED: Use SupabaseDoctors instead
                        Services,
                        Holidays,
                        Shifts,
                        WorkSchedules,
                        TimeSlots,
                        Appointments,
                        LeaveRequests,
                        Notifications
                    )
                }
                println("✅ H2 database schema created successfully")
            } catch (t: Throwable) {
                println("⚠️ Warning: could not create schema: ${t.message}")
            }
        } else {
            // Verify Supabase/PostgreSQL connection
            try {
                transaction {
                    exec("SELECT 1") { }
                }
                println("✅ PostgreSQL/Supabase connection verified")
            } catch (t: Throwable) {
                println("⚠️ Warning: could not verify database connection: ${t.message}")
            }
        }
    }
}
