package com.nhom2.schedulechange

import com.nhom2.common.*
import com.nhom2.Security
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.scheduleChangeRoutes() {
    
    authenticate {
        // ══════════════════════════════════════════════════════════════════════════
        // Doctor Routes - View own schedule change requests
        // ══════════════════════════════════════════════════════════════════════════
        
        /**
         * POST /doctor/schedule-change-requests
         * Create a new schedule change request
         */
        post("/doctor/schedule-change-requests") {
            try {
                println("=== DEBUG: POST /doctor/schedule-change-requests called ===")
                
                val principal = call.principal<JWTPrincipal>()
                println("DEBUG: principal=$principal")
                
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                println("DEBUG: userId=$userId, role=$role")
                
                if (role != "doctor") {
                    println("DEBUG: Access denied - role is $role, not doctor")
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can create schedule change requests. Your role: $role"
                    ))
                }
                
                println("DEBUG: Getting doctor ID for userId=$userId")
                val doctorId = Security.getDoctorIdByUserId(userId)
                
                println("DEBUG: doctorId=$doctorId")
                
                if (doctorId == null) {
                    println("DEBUG: Doctor profile not found for userId=$userId")
                    return@post call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                }
                
                println("DEBUG: Receiving request body...")
                val request = call.receive<CreateScheduleChangeRequest>()
                println("DEBUG: Received request: requestType=${request.requestType}, oldData=${request.oldScheduleData}, newData=${request.newScheduleData}")
                
                println("DEBUG: Creating schedule change request...")
                val createdRequest = ScheduleChangeService.createRequest(doctorId, request)
                println("DEBUG: Successfully created request with ID: ${createdRequest.id}")
                
                call.respond(HttpStatusCode.Created, ApiResponse(
                    success = true,
                    data = createdRequest,
                    message = "Schedule change request created successfully"
                ))
            } catch (e: IllegalArgumentException) {
                println("ERROR: IllegalArgumentException: ${e.message}")
                e.printStackTrace()
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid request",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                println("ERROR: Exception in POST /doctor/schedule-change-requests: ${e.message}")
                e.printStackTrace()
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to create schedule change request",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * GET /doctor/schedule-change-requests
         * Get all schedule change requests for the authenticated doctor
         */
        get("/doctor/schedule-change-requests") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "doctor") {
                    return@get call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can view schedule change requests"
                    ))
                }
                
                val doctorId = Security.getDoctorIdByUserId(userId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                
                val status = call.request.queryParameters["status"]
                val requests = ScheduleChangeService.getByDoctor(doctorId, status)
                
                call.respond(ApiResponse(
                    success = true,
                    data = requests
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to fetch schedule change requests",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        // ══════════════════════════════════════════════════════════════════════════
        // Admin Routes - Manage all schedule change requests
        // ══════════════════════════════════════════════════════════════════════════
        
        /**
         * GET /admin/schedule-change-requests
         * Get all schedule change requests (with pagination)
         */
        get("/admin/schedule-change-requests") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@get call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can view all schedule change requests"
                    ))
                }
                
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val pageSize = call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 20
                val status = call.request.queryParameters["status"]
                
                val response = ScheduleChangeService.getAllRequests(page, pageSize, status)
                
                call.respond(ApiResponse(
                    success = true,
                    data = response
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to fetch schedule change requests",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * GET /admin/schedule-change-requests/pending
         * Get all pending schedule change requests
         */
        get("/admin/schedule-change-requests/pending") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@get call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can view pending requests"
                    ))
                }
                
                val requests = ScheduleChangeService.getPending()
                
                call.respond(ApiResponse(
                    success = true,
                    data = requests
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to fetch pending requests",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * GET /admin/schedule-change-requests/{id}
         * Get a specific schedule change request
         */
        get("/admin/schedule-change-requests/{id}") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@get call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can view schedule change requests"
                    ))
                }
                
                val requestId = UUID.fromString(call.parameters["id"])
                val request = ScheduleChangeService.getRequestById(requestId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Request not found",
                        message = "Schedule change request does not exist"
                    ))
                
                call.respond(ApiResponse(
                    success = true,
                    data = request
                ))
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid request ID format",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to fetch schedule change request",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * POST /admin/schedule-change-requests/{id}/approve
         * Approve a schedule change request
         */
        post("/admin/schedule-change-requests/{id}/approve") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can approve schedule change requests"
                    ))
                }
                
                val requestId = UUID.fromString(call.parameters["id"])
                val approvedRequest = ScheduleChangeService.approve(requestId, userId)
                
                call.respond(ApiResponse(
                    success = true,
                    data = approvedRequest,
                    message = "Schedule change request approved successfully"
                ))
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid request",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to approve schedule change request",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * POST /admin/schedule-change-requests/{id}/reject
         * Reject a schedule change request
         */
        post("/admin/schedule-change-requests/{id}/reject") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "admin") {
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only admins can reject schedule change requests"
                    ))
                }
                
                val requestId = UUID.fromString(call.parameters["id"])
                val reviewRequest = call.receive<ReviewScheduleChangeRequest>()
                
                if (reviewRequest.status != "rejected") {
                    return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                        error = "Invalid status",
                        message = "Status must be 'rejected'"
                    ))
                }
                
                val reason = reviewRequest.rejectionReason
                    ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                        error = "Missing rejection reason",
                        message = "Please provide a reason for rejection"
                    ))
                
                val rejectedRequest = ScheduleChangeService.reject(requestId, userId, reason)
                
                call.respond(ApiResponse(
                    success = true,
                    data = rejectedRequest,
                    message = "Schedule change request rejected"
                ))
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid request",
                    message = e.message ?: "Unknown error"
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to reject schedule change request",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
    }
}
