package com.nhom2.utils

import com.nhom2.config.DatabaseConfig
import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

/**
 * Migration script to fix appointments that have NULL schedule_id
 * This finds the corresponding doctor_schedule for each appointment
 */
fun main() {
    DatabaseConfig.init()
    
    transaction {
        println("Starting migration to fix schedule_id in appointments...")
        
        // Find all appointments with NULL schedule_id
        val appointmentsToFix = Appointments.select { 
            Appointments.scheduleId.isNull() 
        }.toList()
        
        println("Found ${appointmentsToFix.size} appointments to fix")
        
        var fixed = 0
        var failed = 0
        
        appointmentsToFix.forEach { appointment ->
            try {
                val appointmentId = appointment[Appointments.id]
                val timeSlotId = appointment[Appointments.timeSlotId]
                val appointmentDate = appointment[Appointments.appointmentDate]
                
                // Get time_slot to find work_schedule
                val timeSlot = TimeSlots.select { TimeSlots.id eq timeSlotId }
                    .singleOrNull()
                
                if (timeSlot == null) {
                    println("  ❌ Appointment $appointmentId: time_slot not found")
                    failed++
                    return@forEach
                }
                
                val workScheduleId = timeSlot[TimeSlots.workScheduleId]
                
                // Get work_schedule to find doctor and date
                val workSchedule = WorkSchedules.select { WorkSchedules.id eq workScheduleId }
                    .singleOrNull()
                
                if (workSchedule == null) {
                    println("  ❌ Appointment $appointmentId: work_schedule not found")
                    failed++
                    return@forEach
                }
                
                val doctorId = workSchedule[WorkSchedules.doctorId]
                val scheduleDate = workSchedule[WorkSchedules.date]
                
                // Find corresponding doctor_schedule
                val doctorSchedule = DoctorSchedules.select {
                    (DoctorSchedules.doctorId eq doctorId) and
                    (DoctorSchedules.workDate eq scheduleDate)
                }.singleOrNull()
                
                if (doctorSchedule == null) {
                    println("  ❌ Appointment $appointmentId: doctor_schedule not found for doctor $doctorId on $scheduleDate")
                    failed++
                    return@forEach
                }
                
                val scheduleId = doctorSchedule[DoctorSchedules.id]
                
                // Update appointment with schedule_id
                Appointments.update({ Appointments.id eq appointmentId }) {
                    it[Appointments.scheduleId] = scheduleId
                }
                
                println("  ✅ Fixed appointment $appointmentId -> schedule_id: $scheduleId")
                fixed++
                
            } catch (e: Exception) {
                println("  ❌ Error fixing appointment: ${e.message}")
                failed++
            }
        }
        
        println("\n=== Migration Complete ===")
        println("Fixed: $fixed")
        println("Failed: $failed")
        println("Total: ${appointmentsToFix.size}")
    }
}
