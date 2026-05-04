package com.nhom2.test

import io.github.cdimascio.dotenv.dotenv
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.sql.DriverManager

/**
 * Test script để kiểm tra kết nối Supabase
 * 
 * Chạy: kotlinc -script test-supabase-connection.kt
 * Hoặc copy code vào main function và chạy
 */

fun main() {
    println("=== TESTING SUPABASE CONNECTION ===\n")
    
    // Load .env
    val dot = try {
        dotenv { ignoreIfMissing = true }
    } catch (t: Throwable) {
        null
    }
    
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
    
    val dbUrl = envGet("DATABASE_URL") ?: error("DATABASE_URL not set")
    val dbUser = envGet("DATABASE_USER") ?: error("DATABASE_USER not set")
    val dbPassword = envGet("DATABASE_PASSWORD") ?: error("DATABASE_PASSWORD not set")
    
    println("1. Configuration:")
    println("   URL: $dbUrl")
    println("   User: $dbUser")
    println("   Password: ${dbPassword.take(3)}***\n")
    
    // Test 1: Raw JDBC connection
    println("2. Testing raw JDBC connection...")
    try {
        Class.forName("org.postgresql.Driver")
        val conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)
        println("   ✅ Raw JDBC connection successful!")
        
        // Test query
        val stmt = conn.createStatement()
        val rs = stmt.executeQuery("SELECT current_database(), current_user, version()")
        if (rs.next()) {
            println("   Database: ${rs.getString(1)}")
            println("   User: ${rs.getString(2)}")
            println("   Version: ${rs.getString(3).take(50)}...")
        }
        
        // Check users table
        val rsTable = stmt.executeQuery("SELECT COUNT(*) FROM public.users")
        if (rsTable.next()) {
            println("   Users count: ${rsTable.getInt(1)}")
        }
        
        conn.close()
        println()
    } catch (e: Exception) {
        println("   ❌ Error: ${e.message}\n")
        e.printStackTrace()
        return
    }
    
    // Test 2: Exposed connection
    println("3. Testing Exposed ORM connection...")
    try {
        Database.connect(
            url = dbUrl,
            driver = "org.postgresql.Driver",
            user = dbUser,
            password = dbPassword
        )
        
        transaction {
            val result = exec("SELECT current_database()") { rs ->
                if (rs.next()) rs.getString(1) else null
            }
            println("   ✅ Exposed connection successful!")
            println("   Database: $result\n")
        }
    } catch (e: Exception) {
        println("   ❌ Error: ${e.message}\n")
        e.printStackTrace()
        return
    }
    
    // Test 3: Check users table structure
    println("4. Checking users table structure...")
    try {
        val conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)
        val stmt = conn.createStatement()
        val rs = stmt.executeQuery("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
            ORDER BY ordinal_position
        """)
        
        println("   Columns:")
        while (rs.next()) {
            println("   - ${rs.getString(1)}: ${rs.getString(2)} (nullable: ${rs.getString(3)})")
        }
        conn.close()
        println()
    } catch (e: Exception) {
        println("   ❌ Error: ${e.message}\n")
    }
    
    println("=== TEST COMPLETED ===")
}
