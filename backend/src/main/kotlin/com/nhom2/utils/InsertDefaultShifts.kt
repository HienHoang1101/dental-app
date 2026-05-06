package com.nhom2.utils

import com.nhom2.config.DatabaseConfig
import com.nhom2.models.Shifts
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.time.LocalTime

fun main() {
    DatabaseConfig.init()
    
    transaction {
        // Check if shifts already exist
        val existingShifts = Shifts.selectAll().count()
        
        if (existingShifts > 0) {
            println("Shifts already exist. Skipping insertion.")
            return@transaction
        }
        
        println("Inserting default shifts...")
        
        // Morning shift
        Shifts.insert {
            it[name] = "Ca sáng"
            it[startTime] = LocalTime.of(8, 0)
            it[endTime] = LocalTime.of(12, 0)
            it[createdAt] = Instant.now()
        }
        println("✓ Inserted: Ca sáng (08:00 - 12:00)")
        
        // Afternoon shift
        Shifts.insert {
            it[name] = "Ca chiều"
            it[startTime] = LocalTime.of(13, 0)
            it[endTime] = LocalTime.of(17, 0)
            it[createdAt] = Instant.now()
        }
        println("✓ Inserted: Ca chiều (13:00 - 17:00)")
        
        // Full day shift
        Shifts.insert {
            it[name] = "Ca cả ngày"
            it[startTime] = LocalTime.of(8, 0)
            it[endTime] = LocalTime.of(17, 0)
            it[createdAt] = Instant.now()
        }
        println("✓ Inserted: Ca cả ngày (08:00 - 17:00)")
        
        // Evening shift
        Shifts.insert {
            it[name] = "Ca tối"
            it[startTime] = LocalTime.of(17, 0)
            it[endTime] = LocalTime.of(21, 0)
            it[createdAt] = Instant.now()
        }
        println("✓ Inserted: Ca tối (17:00 - 21:00)")
        
        println("\nSuccessfully inserted ${Shifts.selectAll().count()} shifts!")
    }
}
