package com.nhom2.utils

import at.favre.lib.crypto.bcrypt.BCrypt
import com.nhom2.models.*
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.math.BigDecimal
import java.time.LocalDate
import java.time.Instant
import java.time.LocalTime
import java.util.UUID

object SeedData {
    
    fun seed() {
        transaction {
            // Check if data already exists
            if (Users.select { Users.email eq "admin@dental.com" }.count() > 0) {
                println("Seed data already exists, skipping...")
                return@transaction
            }

            println("Seeding initial data...")

            // 1. Create Admin User
            val adminId = Users.insert {
                it[email] = "admin@dental.com"
                it[passwordHash] = BCrypt.withDefaults().hashToString(12, "admin123".toCharArray())
                it[fullName] = "System Administrator"
                it[phone] = "0123456789"
                it[role] = "admin"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Users.id
            println("✓ Created admin user: admin@dental.com / admin123")

            // 2. Create Specialties
            val generalDentistryId = Specialties.insert {
                it[name] = "General Dentistry"
                it[description] = "General dental care and treatment"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Specialties.id

            val orthodonticsId = Specialties.insert {
                it[name] = "Orthodontics"
                it[description] = "Teeth alignment and braces"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Specialties.id

            val cosmeticDentistryId = Specialties.insert {
                it[name] = "Cosmetic Dentistry"
                it[description] = "Teeth whitening and aesthetic procedures"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Specialties.id

            val endodonticsId = Specialties.insert {
                it[name] = "Endodontics"
                it[description] = "Root canal treatment"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Specialties.id
            println("✓ Created 4 specialties")

            // 3. Create Doctor Users
            val doctor1UserId = Users.insert {
                it[email] = "doctor1@dental.com"
                it[passwordHash] = BCrypt.withDefaults().hashToString(12, "doctor123".toCharArray())
                it[fullName] = "Dr. Nguyen Van A"
                it[phone] = "0987654321"
                it[role] = "doctor"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Users.id

            val doctor2UserId = Users.insert {
                it[email] = "doctor2@dental.com"
                it[passwordHash] = BCrypt.withDefaults().hashToString(12, "doctor123".toCharArray())
                it[fullName] = "Dr. Tran Thi B"
                it[phone] = "0987654322"
                it[role] = "doctor"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Users.id

            val doctor3UserId = Users.insert {
                it[email] = "doctor3@dental.com"
                it[passwordHash] = BCrypt.withDefaults().hashToString(12, "doctor123".toCharArray())
                it[fullName] = "Dr. Le Van C"
                it[phone] = "0987654323"
                it[role] = "doctor"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Users.id
            println("✓ Created 3 doctor users")

            // 4. Create Doctor Profiles
            val doctor1Id = Doctors.insert {
                it[userId] = doctor1UserId
                it[specialtyId] = generalDentistryId
                it[qualifications] = "DDS, 10 years experience"
                it[bio] = "Experienced general dentist specializing in preventive care"
                it[avatar] = null
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Doctors.id

            val doctor2Id = Doctors.insert {
                it[userId] = doctor2UserId
                it[specialtyId] = orthodonticsId
                it[qualifications] = "DDS, Orthodontics Specialist"
                it[bio] = "Expert in braces and teeth alignment"
                it[avatar] = null
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Doctors.id

            val doctor3Id = Doctors.insert {
                it[userId] = doctor3UserId
                it[specialtyId] = cosmeticDentistryId
                it[qualifications] = "DDS, Cosmetic Dentistry Specialist"
                it[bio] = "Specializing in teeth whitening and veneers"
                it[avatar] = null
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Doctors.id
            println("✓ Created 3 doctor profiles")

            // 5. Create Services
            Services.insert {
                it[name] = "Teeth Cleaning"
                it[description] = "Professional teeth cleaning and polishing"
                it[price] = BigDecimal("500000")
                it[duration] = 30
                it[category] = "General"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }

            Services.insert {
                it[name] = "Tooth Extraction"
                it[description] = "Safe tooth extraction procedure"
                it[price] = BigDecimal("800000")
                it[duration] = 45
                it[category] = "General"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }

            Services.insert {
                it[name] = "Teeth Whitening"
                it[description] = "Professional teeth whitening treatment"
                it[price] = BigDecimal("2000000")
                it[duration] = 60
                it[category] = "Cosmetic"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }

            Services.insert {
                it[name] = "Braces Installation"
                it[description] = "Metal or ceramic braces installation"
                it[price] = BigDecimal("15000000")
                it[duration] = 90
                it[category] = "Orthodontics"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }

            Services.insert {
                it[name] = "Root Canal Treatment"
                it[description] = "Root canal therapy"
                it[price] = BigDecimal("3000000")
                it[duration] = 90
                it[category] = "Endodontics"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }

            Services.insert {
                it[name] = "Dental Filling"
                it[description] = "Cavity filling with composite material"
                it[price] = BigDecimal("600000")
                it[duration] = 30
                it[category] = "General"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }
            println("✓ Created 6 services")

            // 6. Create Shifts
            val morningShiftId = Shifts.insert {
                it[name] = "Morning Shift"
                it[startTime] = LocalTime.of(8, 0)
                it[endTime] = LocalTime.of(12, 0)
                it[createdAt] = Instant.now()
            } get Shifts.id

            val afternoonShiftId = Shifts.insert {
                it[name] = "Afternoon Shift"
                it[startTime] = LocalTime.of(13, 0)
                it[endTime] = LocalTime.of(17, 0)
                it[createdAt] = Instant.now()
            } get Shifts.id

            val eveningShiftId = Shifts.insert {
                it[name] = "Evening Shift"
                it[startTime] = LocalTime.of(18, 0)
                it[endTime] = LocalTime.of(21, 0)
                it[createdAt] = Instant.now()
            } get Shifts.id
            println("✓ Created 3 shifts")

            // 7. Create Sample Work Schedules for next 7 days
            val today = LocalDate.now()
            for (i in 0..6) {
                val date = today.plusDays(i.toLong())
                
                // Doctor 1 - Morning shift
                val ws1Id = WorkSchedules.insert {
                    it[doctorId] = doctor1Id
                    it[shiftId] = morningShiftId
                    it[WorkSchedules.date] = date
                    it[slotDuration] = 30
                    it[maxPatientPerSlot] = 1
                    it[createdAt] = Instant.now()
                } get WorkSchedules.id

                // Generate time slots for morning shift
                generateTimeSlots(ws1Id, LocalTime.of(8, 0), LocalTime.of(12, 0), 30, 1)

                // Doctor 2 - Afternoon shift
                val ws2Id = WorkSchedules.insert {
                    it[doctorId] = doctor2Id
                    it[shiftId] = afternoonShiftId
                    it[WorkSchedules.date] = date
                    it[slotDuration] = 30
                    it[maxPatientPerSlot] = 1
                    it[createdAt] = Instant.now()
                } get WorkSchedules.id

                generateTimeSlots(ws2Id, LocalTime.of(13, 0), LocalTime.of(17, 0), 30, 1)

                // Doctor 3 - Evening shift
                val ws3Id = WorkSchedules.insert {
                    it[doctorId] = doctor3Id
                    it[shiftId] = eveningShiftId
                    it[WorkSchedules.date] = date
                    it[slotDuration] = 30
                    it[maxPatientPerSlot] = 1
                    it[createdAt] = Instant.now()
                } get WorkSchedules.id

                generateTimeSlots(ws3Id, LocalTime.of(18, 0), LocalTime.of(21, 0), 30, 1)
            }
            println("✓ Created work schedules for next 7 days")

            // 8. Create Sample Patient
            val patientUserId = Users.insert {
                it[email] = "patient@example.com"
                it[passwordHash] = BCrypt.withDefaults().hashToString(12, "patient123".toCharArray())
                it[fullName] = "Nguyen Van Patient"
                it[phone] = "0912345678"
                it[role] = "patient"
                it[isActive] = true
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            } get Users.id

            HealthRecords.insert {
                it[userId] = patientUserId
                it[fullName] = "Nguyen Van Patient"
                it[dateOfBirth] = LocalDate.of(1990, 1, 1)
                it[ethnicity] = "Kinh"
                it[gender] = "male"
                it[occupation] = "Engineer"
                it[phone] = "0912345678"
                it[email] = "patient@example.com"
                it[nationalId] = "001234567890"
                it[address] = "123 Main Street, Hanoi"
                it[allergyNotes] = "None"
                it[medicalHistory] = "No major illnesses"
                it[dentalStatus] = "Good"
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }
            println("✓ Created sample patient with health record")

            // 9. Create Sample Holidays
            Holidays.insert {
                it[date] = LocalDate.of(2025, 1, 1)
                it[name] = "New Year's Day"
                it[description] = "New Year Holiday"
                it[createdAt] = Instant.now()
            }

            Holidays.insert {
                it[date] = LocalDate.of(2025, 4, 30)
                it[name] = "Reunification Day"
                it[description] = "Vietnam Reunification Day"
                it[createdAt] = Instant.now()
            }

            Holidays.insert {
                it[date] = LocalDate.of(2025, 9, 2)
                it[name] = "National Day"
                it[description] = "Vietnam National Day"
                it[createdAt] = Instant.now()
            }
            println("✓ Created sample holidays")

            println("\n=== Seed Data Summary ===")
            println("Admin: admin@dental.com / admin123")
            println("Doctor 1: doctor1@dental.com / doctor123 (General Dentistry)")
            println("Doctor 2: doctor2@dental.com / doctor123 (Orthodontics)")
            println("Doctor 3: doctor3@dental.com / doctor123 (Cosmetic Dentistry)")
            println("Patient: patient@example.com / patient123")
            println("\nSpecialties: 4")
            println("Services: 6")
            println("Shifts: 3")
            println("Work Schedules: Next 7 days for all doctors")
            println("========================\n")
        }
    }

    private fun generateTimeSlots(workScheduleId: UUID, startTime: LocalTime, endTime: LocalTime, slotDuration: Int, maxPatients: Int) {
        var currentTime = startTime
        while (currentTime.plusMinutes(slotDuration.toLong()) <= endTime) {
            val slotEndTime = currentTime.plusMinutes(slotDuration.toLong())
            
            TimeSlots.insert {
                it[TimeSlots.workScheduleId] = workScheduleId
                it[TimeSlots.startTime] = currentTime
                it[TimeSlots.endTime] = slotEndTime
                it[maxPatientPerSlot] = maxPatients
                it[createdAt] = Instant.now()
            }

            currentTime = slotEndTime
        }
    }
}
