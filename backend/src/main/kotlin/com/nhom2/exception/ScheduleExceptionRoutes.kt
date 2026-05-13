package com.nhom2.exception

import com.nhom2.common.*
import com.nhom2.Security
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.LocalDate
import java.util.UUID

fun Route.scheduleExceptionRoutes() {
    
    authenticate {
        // ══════════════════════════════════════════════════════════════════════════
        // Doctor Routes - Manage own schedule exceptions
        // ══════════════════════════════════════════════════════════════════════════
        
        /**
         * GET /api/doctor/schedule-exceptions
         * Get all schedule exceptions for the authenticated doctor
         */
        get("/api/doctor/schedule-exceptions") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "doctor") {
                    return@get call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can view schedule exceptions"
                    ))
                }
                
                val doctorId = Security.getDoctorIdByUserId(userId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                
                val startDateStr = call.request.queryParameters["startDate"]
                val endDateStr = call.request.queryParameters["endDate"]
                
                val exceptions = if (startDateStr != null && endDateStr != null) {
                    val startDate = LocalDate.parse(startDateStr)
                    val endDate = LocalDate.parse(endDateStr)
                    ScheduleExceptionService.getExceptions(doctorId, startDate, endDate)
                } else {
                    ScheduleExceptionService.getAllExceptions(doctorId)
                }
                
                call.respond(ApiResponse(
                    success = true,
                    data = exceptions
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to fetch schedule exceptions",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * POST /api/doctor/schedule-exceptions
         * Create a schedule exception (day off or override)
         */
        post("/api/doctor/schedule-exceptions") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "doctor") {
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can create schedule exceptions"
                    ))
                }
                
                val doctorId = Security.getDoctorIdByUserId(userId)
                    ?: return@post call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                
                val request = call.receive<CreateExceptionRequest>()
                val result = ScheduleExceptionService.addException(doctorId, request)
                
                result.fold(
                    onSuccess = { exception ->
                        call.respond(HttpStatusCode.Created, ApiResponse(
                            success = true,
                            data = exception,
                            message = "Schedule exception created successfully"
                        ))
                    },
                    onFailure = { error ->
                        call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                            error = "Failed to create schedule exception",
                            message = error.message ?: "Unknown error"
                        ))
                    }
                )
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to create schedule exception",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * DELETE /api/doctor/schedule-exceptions/{id}
         * Delete a schedule exception
         */
        delete("/api/doctor/schedule-exceptions/{id}") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "doctor") {
                    return@delete call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can delete schedule exceptions"
                    ))
                }
                
                val doctorId = Security.getDoctorIdByUserId(userId)
                    ?: return@delete call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                
                val exceptionId = UUID.fromString(call.parameters["id"])
                
                // Verify the exception belongs to this doctor
                val exception = ScheduleExceptionService.getExceptionById(exceptionId)
                    ?: return@delete call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Exception not found",
                        message = "Schedule exception does not exist"
                    ))
                
                if (exception.doctorId != doctorId.toString()) {
                    return@delete call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "This exception does not belong to you"
                    ))
                }
                
                val deleted = ScheduleExceptionService.deleteException(exceptionId)
                
                if (deleted) {
                    call.respond(ApiResponse(
                        success = true,
                        data = null,
                        message = "Schedule exception deleted successfully"
                    ))
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Exception not found",
                        message = "Schedule exception does not exist"
                    ))
                }
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid exception ID format",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to delete schedule exception",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        // ══════════════════════════════════════════════════════════════════════════
        // Admin Routes - Manage all schedule exceptions
        // ══════════════════════════════════════════════════════════════════════════
        
        /**
         * GET /api/admin/doctors/{doctorId}/schedule-exceptions
         * Get schedule exceptions for any doctor (admin only)
         */
        get("/api/admin/doctors/{doctorId}/schedule-exceptions") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@get call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can view other doctors' schedule exceptions"
                    ))
                }
                
                val doctorId = UUID.fromString(call.parameters["doctorId"])
                val startDateStr = call.request.queryParameters["startDate"]
                val endDateStr = call.request.queryParameters["endDate"]
                
                val exceptions = if (startDateStr != null && endDateStr != null) {
                    val startDate = LocalDate.parse(startDateStr)
                    val endDate = LocalDate.parse(endDateStr)
                    ScheduleExceptionService.getExceptions(doctorId, startDate, endDate)
                } else {
                    ScheduleExceptionService.getAllExceptions(doctorId)
                }
                
                call.respond(ApiResponse(
                    success = true,
                    data = exceptions
                ))
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid doctor ID format",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to fetch schedule exceptions",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * POST /api/admin/doctors/{doctorId}/schedule-exceptions
         * Create a schedule exception for any doctor (admin only)
         */
        post("/api/admin/doctors/{doctorId}/schedule-exceptions") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can create schedule exceptions for doctors"
                    ))
                }
                
                val doctorId = UUID.fromString(call.parameters["doctorId"])
                val request = call.receive<CreateExceptionRequest>()
                val result = ScheduleExceptionService.addException(doctorId, request)
                
                result.fold(
                    onSuccess = { exception ->
                        call.respond(HttpStatusCode.Created, ApiResponse(
                            success = true,
                            data = exception,
                            message = "Schedule exception created successfully"
                        ))
                    },
                    onFailure = { error ->
                        call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                            error = "Failed to create schedule exception",
                            message = error.message ?: "Unknown error"
                        ))
                    }
                )
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid doctor ID format",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to create schedule exception",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * DELETE /api/admin/schedule-exceptions/{id}
         * Delete any schedule exception (admin only)
         */
        delete("/api/admin/schedule-exceptions/{id}") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@delete call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can delete schedule exceptions"
                    ))
                }
                
                val exceptionId = UUID.fromString(call.parameters["id"])
                val deleted = ScheduleExceptionService.deleteException(exceptionId)
                
                if (deleted) {
                    call.respond(ApiResponse(
                        success = true,
                        data = null,
                        message = "Schedule exception deleted successfully"
                    ))
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Exception not found",
                        message = "Schedule exception does not exist"
                    ))
                }
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid exception ID format",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to delete schedule exception",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
    }
}
