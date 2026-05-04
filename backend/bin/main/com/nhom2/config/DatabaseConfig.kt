package com.nhom2.config

import io.github.cdimascio.dotenv.dotenv
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
<<<<<<< HEAD
import com.nhom2.models.*
=======
import com.nhom2.auth.UserTable
import com.nhom2.auth.PatientProfileTable
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

object DatabaseConfig {
    fun init() {
        // Load .env safely — some .env files may contain duplicate keys which the dotenv library
        // throws on. Fall back to System.getenv if dotenv fails.
        val dot = try {
            dotenv { ignoreIfMissing = true }
        } catch (t: Throwable) {
            null
        }

        // If dotenv failed (e.g. malformed .env), try a simple fallback parser that tolerates
        // duplicate keys by taking the last occurrence. This allows local .env files with
        // duplicate lines to still be used during tests.
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
                emptyMap<String, String>()
            }
        }

        fun envGet(key: String): String? = dot?.get(key) ?: fallbackMap[key] ?: System.getenv(key)

<<<<<<< HEAD
        val dbUrl = envGet("DATABASE_URL") ?: error("DATABASE_URL is not set")
        val dbUser = envGet("DATABASE_USER") ?: error("DATABASE_USER is not set")
        val dbPassword = envGet("DATABASE_PASSWORD") ?: error("DATABASE_PASSWORD is not set")
        
        // DEBUG: Print connection info
        println("🔗 Connecting to: $dbUrl")
        println("👤 User: $dbUser")

        Database.connect(
            url = dbUrl,
            driver = "org.postgresql.Driver",
            user = dbUser,
            password = dbPassword
=======
        Database.connect(
            url = envGet("DATABASE_URL") ?: error("DATABASE_URL is not set"),
            driver = "org.postgresql.Driver",
            user = envGet("DATABASE_USER") ?: error("DATABASE_USER is not set"),
            password = envGet("DATABASE_PASSWORD") ?: error("DATABASE_PASSWORD is not set")
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
        )
        println("Database connected successfully")

        // Create tables automatically in dev/test environments (idempotent)
        try {
<<<<<<< HEAD
            // transaction {
            //     SchemaUtils.create(
            //         Users,
            //         HealthRecords,
            //         Specialties,
            //         Doctors,
            //         Services,
            //         Holidays,
            //         Shifts,
            //         WorkSchedules,
            //         TimeSlots,
            //         Appointments,
            //         LeaveRequests,
            //         Notifications
            //     )
            // }
            println("Database schema ensured successfully")
=======
            transaction {
                SchemaUtils.create(UserTable, PatientProfileTable)
            }
            println("Database schema ensured (UserTable, PatientProfileTable)")
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
        } catch (t: Throwable) {
            println("Warning: could not create schema automatically: ${t.message}")
        }
    }
}
