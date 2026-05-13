package com.nhom2.notification

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.notificationRoutes() {
    route("/notifications") {
        authenticate {
            // Get current user's notifications
            get {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    val unreadOnly = call.request.queryParameters["unreadOnly"]?.toBoolean() ?: false
                    val notifications = NotificationService.getNotificationsByUser(userId, unreadOnly)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = notifications))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get unread count
            get("/unread-count") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    val count = NotificationService.getUnreadCount(userId)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = mapOf("count" to count)))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Mark notification as read
            put("/{id}/read") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val id = UUID.fromString(call.parameters["id"])
                    
                    // Verify notification belongs to user
                    val notification = NotificationService.getNotificationById(id)
                    if (notification == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Notification not found"))
                        return@put
                    }
                    
                    if (notification.userId != userId.toString()) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }
                    
                    val success = NotificationService.markAsRead(id)
                    if (success) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Notification marked as read"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Notification not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to mark notification as read")
                    )
                }
            }

            // Mark all notifications as read
            put("/read-all") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    val count = NotificationService.markAllAsRead(userId)
                    call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "$count notifications marked as read"))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to mark notifications as read")
                    )
                }
            }

            // Delete notification
            delete("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val id = UUID.fromString(call.parameters["id"])
                    
                    // Verify notification belongs to user
                    val notification = NotificationService.getNotificationById(id)
                    if (notification == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Notification not found"))
                        return@delete
                    }
                    
                    if (notification.userId != userId.toString()) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@delete
                    }
                    
                    val deleted = NotificationService.deleteNotification(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Notification deleted successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Notification not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "DELETE_FAILED", message = e.message ?: "Failed to delete notification")
                    )
                }
            }
        }
    }
}
