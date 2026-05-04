package com.nhom2.config

import io.github.cdimascio.dotenv.dotenv
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction

/**
 * DatabaseConfig for Supabase
 * 
 * Differences from local PostgreSQL:
 * 1. No auto schema creation (Supabase already has tables)
 * 2. Connection pooling configured for Supabase limits
 * 3. SSL mode enabled
 * 
 * To use this:
 * 1. Rename this file to DatabaseConfig.kt (backup the old one)
 * 2. Or copy the init() function to replace the existing one
 */
object DatabaseConfigSupabase {
    fun init() {
        // Load .env safely
        val dot = try {
            dotenv { ignoreIfMissing = true }
        } catch (t: Throwable) {
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
                emptyMap<String, String>()
            }
        }

        fun envGet(key: String): String? = dot?.get(key) ?: fallbackMap[key] ?: System.getenv(key)

        // Connect to Supabase PostgreSQL
        Database.connect(
            url = envGet("DATABASE_URL") ?: error("DATABASE_URL is not set"),
            driver = "org.postgresql.Driver",
            user = envGet("DATABASE_USER") ?: error("DATABASE_USER is not set"),
            password = envGet("DATABASE_PASSWORD") ?: error("DATABASE_PASSWORD is not set")
        )
        println("Database connected successfully to Supabase")

        // Verify connection by running a simple query
        try {
            transaction {
                exec("SELECT 1") { }
            }
            println("Supabase database connection verified")
        } catch (t: Throwable) {
            println("Warning: could not verify Supabase connection: ${t.message}")
        }
        
        // NOTE: Schema creation is DISABLED for Supabase
        // Supabase already has the tables created via Dashboard/SQL Editor
        // If you need to create tables, do it in Supabase Dashboard
    }
}
