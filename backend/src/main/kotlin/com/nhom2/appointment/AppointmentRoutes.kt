package com.nhom2.appointment

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.appointmentRoutes() {
    route("/appointments") {
        authenticate {
            // Patient: Create appointment
            post {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "patient") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Only patients can create appointments"))
                        return@post
                    }

                    val request = call.receive<CreateAppointmentRequest>()
                    call.application.environment.log.info("Creating appointment for user $userId: $request")
                    
                    val result = AppointmentService.createAppointment(userId, request)
                    
                    result.onSuccess { appointment ->
                        call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = appointment))
                    }.onFailure { error ->
                        call.application.environment.log.error("Failed to create appointment", error)
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ErrorResponse(error = "CREATE_FAILED", message = error.message ?: "Failed to create appointment")
                        )
                    }
                } catch (e: Exception) {
                    call.application.environment.log.error("Error creating appointment", e)
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Patient: Get own appointments
            get("/my") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "patient") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val status = call.request.queryParameters["status"]
                    val appointments = AppointmentService.getAppointmentsByPatient(userId, status)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointments))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Doctor: Get own appointments
            get("/doctor/my") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    // Get doctor ID from user ID
                    val doctor = com.nhom2.doctors.SupabaseDoctorService.getDoctorByUserId(userId)
                    if (doctor == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                        return@get
                    }

                    val status = call.request.queryParameters["status"]
                    val appointments = AppointmentService.getAppointmentsByDoctor(UUID.fromString(doctor.id), status)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointments))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin: Get all appointments with filters
            get {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

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

            // Get appointment by ID
            get("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    val id = UUID.fromString(call.parameters["id"])
                    val appointment = AppointmentService.getAppointmentById(id)
                    
                    if (appointment == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Appointment not found"))
                        return@get
                    }

                    // Check authorization
                    val isAuthorized = when (role) {
                        "admin" -> true
                        "patient" -> appointment.patient.id == userId.toString()
                        "doctor" -> {
                            val doctor = com.nhom2.doctors.SupabaseDoctorService.getDoctorByUserId(userId)
                            doctor?.id == appointment.doctor.id
                        }
                        else -> false
                    }

                    if (!isAuthorized) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Doctor/Admin: Update appointment status
            put("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role !in listOf("doctor", "admin")) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateAppointmentRequest>()
                    val appointment = AppointmentService.updateAppointmentStatus(id, request, userId)
                    
                    if (appointment != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Appointment not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update appointment")
                    )
                }
            }

            // Patient/Doctor/Admin: Cancel appointment
            delete("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    val id = UUID.fromString(call.parameters["id"])
                    val reason = call.request.queryParameters["reason"] ?: "No reason provided"
                    
                    val appointment = AppointmentService.cancelAppointment(id, reason, userId)
                    
                    if (appointment != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment, message = "Appointment cancelled successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Appointment not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CANCEL_FAILED", message = e.message ?: "Failed to cancel appointment")
                    )
                }
            }
        }
    }
}
