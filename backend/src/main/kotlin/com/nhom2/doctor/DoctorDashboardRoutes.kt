package com.nhom2.doctor

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.doctorDashboardRoutes() {
    route("/doctor") {
        authenticate {
            // Get doctor's own profile
            get("/profile") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val doctor = DoctorDashboardService.getDoctorByUserId(userId)
                    if (doctor != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctor))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Update doctor's own profile
            put("/profile") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val request = call.receive<UpdateDoctorProfileRequest>()
                    val doctor = DoctorDashboardService.updateDoctorProfile(userId, request)
                    
                    if (doctor != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctor))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                    }
                } catch (e: IllegalArgumentException) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "VALIDATION_ERROR", message = e.message ?: "Invalid request")
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update profile")
                    )
                }
            }

            // Get doctor's appointments
            get("/appointments") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val startDate = call.request.queryParameters["startDate"]
                    val endDate = call.request.queryParameters["endDate"]
                    val status = call.request.queryParameters["status"]
                    val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                    val pageSize = call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 20

                    val result = DoctorDashboardService.getDoctorAppointments(
                        userId, startDate, endDate, status, page, pageSize
                    )
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = result))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get appointment by ID
            get("/appointments/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val appointmentId = UUID.fromString(call.parameters["id"])
                    val appointment = DoctorDashboardService.getAppointmentById(userId, appointmentId)
                    
                    if (appointment != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Appointment not found"))
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Confirm appointment
            put("/appointments/{id}/confirm") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val appointmentId = UUID.fromString(call.parameters["id"])
                    val appointment = DoctorDashboardService.confirmAppointment(userId, appointmentId)
                    
                    if (appointment != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Appointment not found or access denied"))
                    }
                } catch (e: IllegalStateException) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "INVALID_STATE", message = e.message ?: "Cannot confirm appointment")
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to confirm appointment")
                    )
                }
            }

            // Cancel appointment
            put("/appointments/{id}/cancel") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val appointmentId = UUID.fromString(call.parameters["id"])
                    val request = call.receive<CancelAppointmentRequest>()
                    val appointment = DoctorDashboardService.cancelAppointment(userId, appointmentId, request.cancellationReason)
                    
                    if (appointment != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Appointment not found or access denied"))
                    }
                } catch (e: IllegalStateException) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "INVALID_STATE", message = e.message ?: "Cannot cancel appointment")
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to cancel appointment")
                    )
                }
            }

            // Get doctor's patients (who have appointments)
            get("/patients") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val patients = DoctorDashboardService.getDoctorPatients(userId)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = patients))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get patient health record
            get("/patients/{patientId}/health-record") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val patientId = UUID.fromString(call.parameters["patientId"])
                    val healthRecord = DoctorDashboardService.getPatientHealthRecord(userId, patientId)
                    
                    if (healthRecord != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = healthRecord))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Health record not found or access denied"))
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get work schedules
            get("/work-schedules") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val startDate = call.request.queryParameters["startDate"]
                    val endDate = call.request.queryParameters["endDate"]
                    
                    val schedules = DoctorDashboardService.getDoctorWorkSchedules(userId, startDate, endDate)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = schedules))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Register work schedule (simplified - just mark availability)
            post("/work-schedules") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<RegisterWorkScheduleRequest>()
                    val schedule = DoctorDashboardService.registerWorkSchedule(userId, request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = schedule))
                } catch (e: IllegalArgumentException) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "VALIDATION_ERROR", message = e.message ?: "Invalid request")
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to register work schedule")
                    )
                }
            }

            // Get leave requests
            get("/leave-requests") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val leaveRequests = DoctorDashboardService.getDoctorLeaveRequests(userId)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = leaveRequests))
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Create leave request
            post("/leave-requests") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<CreateLeaveRequestRequest>()
                    val leaveRequest = DoctorDashboardService.createLeaveRequest(userId, request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = leaveRequest))
                } catch (e: IllegalArgumentException) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "VALIDATION_ERROR", message = e.message ?: "Invalid request")
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create leave request")
                    )
                }
            }
        }
    }
}
