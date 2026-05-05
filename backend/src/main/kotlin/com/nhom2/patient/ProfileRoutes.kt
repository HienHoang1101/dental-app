package com.nhom2.patient

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.patientRoutes() {
    route("/patient") {
        authenticate {
            // Get health record
            get("/profile") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    val healthRecord = com.nhom2.healthrecord.HealthRecordService.getHealthRecordByUserId(userId)
                    if (healthRecord != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = healthRecord))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Health record not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Create health record
            post("/profile") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val request = call.receive<com.nhom2.common.CreateHealthRecordRequest>()
                    
                    val healthRecord = com.nhom2.healthrecord.HealthRecordService.createHealthRecord(userId, request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = healthRecord))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create health record")
                    )
                }
            }

            // Update health record
            put("/profile") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val request = call.receive<com.nhom2.common.UpdateHealthRecordRequest>()
                    
                    val healthRecord = com.nhom2.healthrecord.HealthRecordService.updateHealthRecord(userId, request)
                    if (healthRecord != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = healthRecord))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Health record not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update health record")
                    )
                }
            }

            // Get my appointments
            get("/appointments") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    val status = call.request.queryParameters["status"]
                    val startDate = call.request.queryParameters["startDate"]
                    val endDate = call.request.queryParameters["endDate"]
                    val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                    val pageSize = call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 20
                    
                    val filter = AppointmentFilterRequest(
                        startDate = startDate,
                        endDate = endDate,
                        doctorId = null,
                        specialtyId = null,
                        status = status,
                        page = page,
                        pageSize = pageSize
                    )
                    
                    val appointments = com.nhom2.appointment.AppointmentService.getAppointmentsByPatient(userId, status)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = PaginatedResponse(
                        items = appointments,
                        total = appointments.size,
                        page = page,
                        pageSize = pageSize,
                        totalPages = (appointments.size + pageSize - 1) / pageSize
                    )))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get notifications
            get("/notifications") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val unreadOnly = call.request.queryParameters["unreadOnly"]?.toBoolean() ?: false
                    
                    val notifications = com.nhom2.notification.NotificationService.getNotificationsByUser(userId, unreadOnly)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = notifications))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get unread notification count
            get("/notifications/unread-count") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    val count = com.nhom2.notification.NotificationService.getUnreadCount(userId)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = mapOf("count" to count)))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Mark notification as read
            put("/notifications/{id}/read") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val notificationId = UUID.fromString(call.parameters["id"])
                    
                    // Verify notification belongs to user
                    val notification = com.nhom2.notification.NotificationService.getNotificationById(notificationId)
                    if (notification == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Notification not found"))
                        return@put
                    }
                    
                    if (notification.userId != userId.toString()) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }
                    
                    val success = com.nhom2.notification.NotificationService.markAsRead(notificationId)
                    if (success) {
                        val updatedNotification = com.nhom2.notification.NotificationService.getNotificationById(notificationId)
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = updatedNotification))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Notification not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Mark all notifications as read
            put("/notifications/read-all") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    com.nhom2.notification.NotificationService.markAllAsRead(userId)
                    call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "All notifications marked as read"))
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