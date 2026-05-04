package com.nhom2.admin

import com.nhom2.common.*
import com.nhom2.models.*
import com.nhom2.doctors.DoctorService
import com.nhom2.appointment.AppointmentService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
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

            // Get all doctors
            get("/doctors") {
                try {
                    val doctors = DoctorService.getAllDoctors(activeOnly = false)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctors))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
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
                                val healthRecord = HealthRecords.select { HealthRecords.userId eq userId }
                                    .singleOrNull()
                                
                                mapOf(
                                    "id" to userId.toString(),
                                    "name" to row[Users.fullName],
                                    "email" to row[Users.email],
                                    "phone" to row[Users.phone],
                                    "isActive" to row[Users.isActive],
                                    "createdAt" to row[Users.createdAt].toString(),
                                    "dateOfBirth" to healthRecord?.get(HealthRecords.dateOfBirth)?.toString(),
                                    "gender" to healthRecord?.get(HealthRecords.gender),
                                    "allergies" to healthRecord?.get(HealthRecords.allergyNotes)
                                )
                            }
                    }
                    
                    call.respond(
                        HttpStatusCode.OK,
                        ApiResponse(success = true, data = mapOf("patients" to patients, "total" to patients.size))
                    )
                } catch (e: Exception) {
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
                        
                        val healthRecord = HealthRecords.select { HealthRecords.userId eq id }
                            .singleOrNull()
                        
                        mapOf(
                            "id" to user[Users.id].toString(),
                            "name" to user[Users.fullName],
                            "email" to user[Users.email],
                            "phone" to user[Users.phone],
                            "isActive" to user[Users.isActive],
                            "createdAt" to user[Users.createdAt].toString(),
                            "dateOfBirth" to healthRecord?.get(HealthRecords.dateOfBirth)?.toString(),
                            "gender" to healthRecord?.get(HealthRecords.gender),
                            "address" to healthRecord?.get(HealthRecords.address),
                            "allergies" to healthRecord?.get(HealthRecords.allergyNotes),
                            "medicalHistory" to healthRecord?.get(HealthRecords.medicalHistory)
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
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get doctor schedules
            get("/doctors/{doctorId}/schedules") {
                try {
                    val doctorId = UUID.fromString(call.parameters["doctorId"])
                    val date = call.request.queryParameters["date"]
                    
                    // This is a placeholder - you'll need to implement actual schedule logic
                    val schedules = emptyList<Map<String, Any>>()
                    
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = schedules))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }
        }
    }
}
