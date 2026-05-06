package com.nhom2.admin

import com.nhom2.common.*
import com.nhom2.models.*
import com.nhom2.doctors.SupabaseDoctorService
import com.nhom2.appointment.AppointmentService
import com.nhom2.utils.PasswordHasher
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID
fun Route.adminApiRoutes() {
    route("/admin") {
        authenticate {
            // Middleware to check admin role
            intercept(ApplicationCallPipeline.Call) {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    call.respond(
                        HttpStatusCode.Forbidden,
                        ErrorResponse(error = "FORBIDDEN", message = "Access denied. Admin role required.")
                    )
                    finish()
                }
            }

            // Dashboard stats
            get("/dashboard/stats") {
                try {
                    val stats = transaction {
                        val totalPatients = Users.select { Users.role eq "patient" }.count()
                        val totalDoctors = Users.select { Users.role eq "doctor" }.count()
                        val totalAppointments = Appointments.selectAll().count()
                        val pendingAppointments = Appointments.select { Appointments.status eq "pending" }.count()
                        val confirmedAppointments = Appointments.select { Appointments.status eq "confirmed" }.count()
                        val completedAppointments = Appointments.select { Appointments.status eq "completed" }.count()
                        val cancelledAppointments = Appointments.select { Appointments.status eq "cancelled" }.count()

                        mapOf(
                            "totalPatients" to totalPatients,
                            "totalDoctors" to totalDoctors,
                            "totalAppointments" to totalAppointments,
                            "pendingAppointments" to pendingAppointments,
                            "confirmedAppointments" to confirmedAppointments,
                            "completedAppointments" to completedAppointments,
                            "cancelledAppointments" to cancelledAppointments
                        )
                    }
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = stats))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get all doctors
            get("/doctors") {
                try {
                    val doctors = SupabaseDoctorService.getAllDoctors(activeOnly = false)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctors))
                } catch (e: Exception) {
                    e.printStackTrace() // Log the full stack trace
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = "Failed to fetch doctors: ${e.message}")
                    )
                }
            }

            // Get doctor by ID
            get("/doctors/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val doctor = SupabaseDoctorService.getDoctorById(id)
                    
                    if (doctor != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctor))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "Doctor not found")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Create doctor (creates both user and doctor profile)
            post("/doctors") {
                try {
                    val request = call.receive<CreateDoctorWithUserRequest>()
                    
                    // Check if email already exists
                    val emailExists = transaction {
                        Users.select { Users.email eq request.email }.count() > 0
                    }
                    
                    if (emailExists) {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ErrorResponse(error = "EMAIL_EXISTS", message = "Email đã tồn tại trong hệ thống")
                        )
                        return@post
                    }
                    
                    // Create user first
                    val userId = transaction {
                        Users.insert {
                            it[email] = request.email
                            it[passwordHash] = PasswordHasher.hash(request.password)
                            it[fullName] = request.fullName
                            it[phone] = request.phone
                            it[role] = "doctor"
                            it[isActive] = true
                            it[createdAt] = Instant.now()
                            it[updatedAt] = Instant.now()
                        } get Users.id
                    }
                    
                    // Create doctor profile
                    val doctorRequest = CreateSupabaseDoctorRequest(
                        userId = userId.toString(),
                        fullName = request.fullName,
                        specialty = request.specialty,
                        degree = request.degree,
                        bio = request.bio,
                        avatarUrl = request.avatarUrl
                    )
                    
                    val doctor = SupabaseDoctorService.createDoctor(doctorRequest)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = doctor))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = "Tạo bác sĩ thất bại: ${e.message}")
                    )
                }
            }

            // Update doctor
            put("/doctors/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateSupabaseDoctorRequest>()
                    val doctor = SupabaseDoctorService.updateDoctor(id, request)
                    
                    if (doctor != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctor))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "Doctor not found")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update doctor")
                    )
                }
            }

            // Delete doctor
            delete("/doctors/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val deleted = SupabaseDoctorService.deleteDoctor(id)
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Doctor deleted successfully"))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "Doctor not found")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "DELETE_FAILED", message = e.message ?: "Failed to delete doctor")
                    )
                }
            }

            // Get all users
            get("/users") {
                try {
                    val users = transaction {
                        Users.selectAll()
                            .orderBy(Users.createdAt to SortOrder.DESC)
                            .map { row ->
                                UserDTO(
                                    id = row[Users.id].toString(),
                                    email = row[Users.email],
                                    fullName = row[Users.fullName],
                                    phone = row[Users.phone],
                                    role = row[Users.role],
                                    isActive = row[Users.isActive],
                                    createdAt = row[Users.createdAt].toString(),
                                    updatedAt = row[Users.updatedAt].toString()
                                )
                            }
                    }
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = users))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Create user
            post("/users") {
                try {
                    val request = call.receive<CreateUserRequest>()
                    
                    // Check if email already exists
                    val exists = transaction {
                        Users.select { Users.email eq request.email }.count() > 0
                    }
                    
                    if (exists) {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ErrorResponse(error = "EMAIL_EXISTS", message = "Email already exists")
                        )
                        return@post
                    }

                    val user = transaction {
                        val userId = Users.insert {
                            it[email] = request.email
                            it[passwordHash] = PasswordHasher.hash(request.password)
                            it[fullName] = request.fullName
                            it[phone] = request.phone
                            it[role] = request.role
                            it[isActive] = true
                            it[createdAt] = Instant.now()
                            it[updatedAt] = Instant.now()
                        } get Users.id

                        mapOf(
                            "id" to userId.toString(),
                            "email" to request.email,
                            "fullName" to request.fullName,
                            "phone" to request.phone,
                            "role" to request.role,
                            "isActive" to true
                        )
                    }
                    
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = user))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create user")
                    )
                }
            }

            // Update user
            put("/users/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateUserRequest>()
                    
                    val user = transaction {
                        val exists = Users.select { Users.id eq id }.count() > 0
                        if (!exists) return@transaction null

                        Users.update({ Users.id eq id }) {
                            request.fullName?.let { name -> it[fullName] = name }
                            request.phone?.let { phoneNum -> it[phone] = phoneNum }
                            request.isActive?.let { active -> it[isActive] = active }
                            it[updatedAt] = Instant.now()
                        }

                        Users.select { Users.id eq id }.single().let { row ->
                            mapOf(
                                "id" to row[Users.id].toString(),
                                "email" to row[Users.email],
                                "fullName" to row[Users.fullName],
                                "phone" to row[Users.phone],
                                "role" to row[Users.role],
                                "isActive" to row[Users.isActive],
                                "createdAt" to row[Users.createdAt].toString(),
                                "updatedAt" to row[Users.updatedAt].toString()
                            )
                        }
                    }
                    
                    if (user != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = user))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "User not found")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update user")
                    )
                }
            }

            // Delete user
            delete("/users/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    
                    val deleted = transaction {
                        Users.deleteWhere { Users.id eq id } > 0
                    }
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "User deleted successfully"))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "User not found")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "DELETE_FAILED", message = e.message ?: "Failed to delete user")
                    )
                }
            }

            // Get all patients
            get("/patients") {
                try {
                    val patients = transaction {
                        Users.select { Users.role eq "patient" }
                            .map { row ->
                                val userId = row[Users.id]
                                val patientProfile = PatientProfiles.select { PatientProfiles.userId eq userId }
                                    .singleOrNull()
                                
                                PatientDTO(
                                    id = userId.toString(),
                                    name = row[Users.fullName],
                                    email = row[Users.email],
                                    phone = row[Users.phone],
                                    isActive = row[Users.isActive],
                                    createdAt = row[Users.createdAt].toString(),
                                    dateOfBirth = patientProfile?.get(PatientProfiles.dateOfBirth)?.toString(),
                                    gender = patientProfile?.get(PatientProfiles.gender),
                                    allergies = patientProfile?.get(PatientProfiles.allergyNotes)
                                )
                            }
                    }
                    
                    val response = PatientListResponse(
                        patients = patients,
                        total = patients.size
                    )
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = response))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get all appointments with filters
            get("/appointments") {
                try {
                    val filter = AppointmentFilterRequest(
                        startDate = call.request.queryParameters["startDate"],
                        endDate = call.request.queryParameters["endDate"],
                        doctorId = call.request.queryParameters["doctorId"],
                        specialtyId = call.request.queryParameters["specialtyId"],
                        status = call.request.queryParameters["status"],
                        page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1,
                        pageSize = call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 20
                    )

                    val result = AppointmentService.getAllAppointments(filter)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = result))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get appointment detail
            get("/appointments/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val appointment = AppointmentService.getAppointmentById(id)
                    
                    if (appointment != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "Appointment not found")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Update appointment status
            put("/appointments/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateAppointmentRequest>()
                    
                    val appointment = AppointmentService.updateAppointmentStatus(id, request, userId)
                    
                    if (appointment != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "Appointment not found")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update appointment")
                    )
                }
            }

            // Get patient detail
            get("/patients/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val patient = transaction {
                        val user = Users.select { Users.id eq id }.singleOrNull()
                            ?: return@transaction null
                        
                        val patientProfile = PatientProfiles.select { PatientProfiles.userId eq id }
                            .singleOrNull()
                        
                        PatientDTO(
                            id = user[Users.id].toString(),
                            name = user[Users.fullName],
                            email = user[Users.email],
                            phone = user[Users.phone],
                            isActive = user[Users.isActive],
                            createdAt = user[Users.createdAt].toString(),
                            dateOfBirth = patientProfile?.get(PatientProfiles.dateOfBirth)?.toString(),
                            gender = patientProfile?.get(PatientProfiles.gender),
                            allergies = patientProfile?.get(PatientProfiles.allergyNotes),
                            medicalHistory = patientProfile?.get(PatientProfiles.medicalHistory)
                        )
                    }
                    
                    if (patient != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = patient))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            ErrorResponse(error = "NOT_FOUND", message = "Patient not found")
                        )
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get doctor schedules by doctor ID
            get("/doctors/{doctorId}/schedules") {
                try {
                    val doctorId = UUID.fromString(call.parameters["doctorId"])
                    val date = call.request.queryParameters["date"]
                    
                    val schedules = transaction {
                        val query = if (date != null) {
                            DoctorSchedules.select { 
                                (DoctorSchedules.doctorId eq doctorId) and 
                                (DoctorSchedules.workDate eq java.time.LocalDate.parse(date))
                            }
                        } else {
                            DoctorSchedules.select { DoctorSchedules.doctorId eq doctorId }
                        }
                        
                        query.map { row ->
                            mapOf(
                                "id" to row[DoctorSchedules.id].toString(),
                                "doctorId" to row[DoctorSchedules.doctorId].toString(),
                                "workDate" to row[DoctorSchedules.workDate].toString(),
                                "slotStart" to row[DoctorSchedules.slotStart].toString(),
                                "slotEnd" to row[DoctorSchedules.slotEnd].toString(),
                                "isBooked" to row[DoctorSchedules.isBooked],
                                "createdAt" to row[DoctorSchedules.createdAt].toString()
                            )
                        }
                    }
                    
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = schedules))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get all doctor schedules (for admin view)
            get("/doctor-schedules") {
                try {
                    val date = call.request.queryParameters["date"]
                    println("=== DEBUG: Getting doctor schedules for date: $date ===")
                    
                    val schedules = transaction {
                        try {
                            // First, check if we have any schedules at all
                            val totalCount = DoctorSchedules.selectAll().count()
                            println("Total schedules in database: $totalCount")
                            
                            val baseQuery = if (date != null) {
                                val parsedDate = java.time.LocalDate.parse(date)
                                println("Parsed date: $parsedDate")
                                DoctorSchedules.select { DoctorSchedules.workDate eq parsedDate }
                            } else {
                                DoctorSchedules.selectAll()
                            }
                            
                            val scheduleCount = baseQuery.count()
                            println("Schedules found for query: $scheduleCount")
                            
                            baseQuery.map { scheduleRow ->
                                val doctorId = scheduleRow[DoctorSchedules.doctorId]
                                println("Processing schedule for doctor ID: $doctorId")
                                
                                // Query doctor info separately to avoid join issues
                                val doctor = try {
                                    SupabaseDoctors.select { SupabaseDoctors.id eq doctorId }.singleOrNull()
                                } catch (e: Exception) {
                                    println("Error fetching doctor $doctorId: ${e.message}")
                                    null
                                }
                                
                                val doctorName = doctor?.get(SupabaseDoctors.fullName) ?: "Unknown"
                                val specialty = doctor?.get(SupabaseDoctors.specialty) ?: "Unknown"
                                println("Doctor: $doctorName, Specialty: $specialty")
                                
                                DoctorScheduleResponse(
                                    id = scheduleRow[DoctorSchedules.id].toString(),
                                    doctorId = doctorId.toString(),
                                    doctorName = doctorName,
                                    specialty = specialty,
                                    workDate = scheduleRow[DoctorSchedules.workDate].toString(),
                                    slotStart = scheduleRow[DoctorSchedules.slotStart].toString(),
                                    slotEnd = scheduleRow[DoctorSchedules.slotEnd].toString(),
                                    isBooked = scheduleRow[DoctorSchedules.isBooked],
                                    createdAt = scheduleRow[DoctorSchedules.createdAt].toString()
                                )
                            }
                        } catch (e: Exception) {
                            println("Error in transaction: ${e.message}")
                            e.printStackTrace()
                            throw e
                        }
                    }
                    
                    println("Returning ${schedules.size} schedules")
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = schedules))
                } catch (e: Exception) {
                    println("=== ERROR in doctor-schedules endpoint ===")
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Utility: Migrate doctor users to doctor profiles
            post("/migrate-doctors") {
                try {
                    val result = com.nhom2.utils.MigrateDoctors.createMissingDoctorProfiles()
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = result))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "MIGRATION_FAILED", message = "Migration failed: ${e.message}")
                    )
                }
            }

            // Utility: Check database structure
            get("/check-database") {
                try {
                    val result = com.nhom2.utils.SimpleMigration.checkDatabaseStructure()
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = result))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CHECK_FAILED", message = "Check failed: ${e.message}")
                    )
                }
            }

            // Utility: Create default specialty
            post("/create-default-specialty") {
                try {
                    val result = com.nhom2.utils.SimpleMigration.createDefaultSpecialty()
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = result))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = "Create failed: ${e.message}")
                    )
                }
            }
        }
    }
}
