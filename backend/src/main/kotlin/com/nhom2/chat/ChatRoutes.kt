package com.nhom2.chat

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.chatRoutes() {
    route("/chat") {
        authenticate("auth-jwt") {
            
            /**
             * POST /api/chat/sessions
             * Tạo chat session mới
             */
            post("/sessions") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = principal?.payload?.getClaim("userId")?.asString()
                        ?: return@post call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))
                    
                    val patientId = UUID.fromString(userId)
                    val session = ChatService.createSession(patientId)
                    
                    call.respond(HttpStatusCode.Created, session)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to e.message))
                }
            }
            
            /**
             * GET /api/chat/sessions
             * Lấy danh sách sessions của user hiện tại
             */
            get("/sessions") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = principal?.payload?.getClaim("userId")?.asString()
                        ?: return@get call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))
                    
                    val patientId = UUID.fromString(userId)
                    val sessions = ChatService.getSessionsByPatient(patientId)
                    
                    call.respond(HttpStatusCode.OK, sessions)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to e.message))
                }
            }
            
            /**
             * GET /api/chat/sessions/{id}
             * Lấy chi tiết session với messages
             */
            get("/sessions/{id}") {
                try {
                    val sessionId = call.parameters["id"]?.let { UUID.fromString(it) }
                        ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid session ID"))
                    
                    val principal = call.principal<JWTPrincipal>()
                    val userId = principal?.payload?.getClaim("userId")?.asString()
                        ?: return@get call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))
                    
                    val chatHistory = ChatService.getSessionWithMessages(sessionId)
                        ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "Session not found"))
                    
                    // Verify ownership
                    if (chatHistory.session.patientId != userId) {
                        return@get call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                    }
                    
                    call.respond(HttpStatusCode.OK, chatHistory)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to e.message))
                }
            }
            
            /**
             * POST /api/chat/sessions/{id}/messages
             * Gửi tin nhắn
             */
            post("/sessions/{id}/messages") {
                try {
                    val sessionId = call.parameters["id"]?.let { UUID.fromString(it) }
                        ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid session ID"))
                    
                    val principal = call.principal<JWTPrincipal>()
                    val userId = principal?.payload?.getClaim("userId")?.asString()
                        ?: return@post call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))
                    
                    // Verify session ownership
                    val session = ChatService.getSessionWithMessages(sessionId)
                        ?: return@post call.respond(HttpStatusCode.NotFound, mapOf("error" to "Session not found"))
                    
                    if (session.session.patientId != userId) {
                        return@post call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                    }
                    
                    val request = call.receive<SendMessageRequest>()
                    
                    if (request.content.isBlank()) {
                        return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Message content cannot be empty"))
                    }
                    
                    val response = ChatService.sendMessage(sessionId, request.content)
                    
                    call.respond(HttpStatusCode.OK, response)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to e.message))
                }
            }
            
            /**
             * POST /api/chat/sessions/{id}/summary
             * Tạo summary cho session (gọi khi đặt lịch)
             */
            post("/sessions/{id}/summary") {
                try {
                    val sessionId = call.parameters["id"]?.let { UUID.fromString(it) }
                        ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid session ID"))
                    
                    val principal = call.principal<JWTPrincipal>()
                    val userId = principal?.payload?.getClaim("userId")?.asString()
                        ?: return@post call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))
                    
                    // Verify session ownership
                    val session = ChatService.getSessionWithMessages(sessionId)
                        ?: return@post call.respond(HttpStatusCode.NotFound, mapOf("error" to "Session not found"))
                    
                    if (session.session.patientId != userId) {
                        return@post call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                    }
                    
                    val summary = ChatService.createSummary(sessionId)
                        ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No messages to summarize"))
                    
                    call.respond(HttpStatusCode.OK, mapOf("summary" to summary))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to e.message))
                }
            }
            
            /**
             * DELETE /api/chat/sessions/{id}
             * Xóa session
             */
            delete("/sessions/{id}") {
                try {
                    val sessionId = call.parameters["id"]?.let { UUID.fromString(it) }
                        ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid session ID"))
                    
                    val principal = call.principal<JWTPrincipal>()
                    val userId = principal?.payload?.getClaim("userId")?.asString()
                        ?: return@delete call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))
                    
                    // Verify session ownership
                    val session = ChatService.getSessionWithMessages(sessionId)
                        ?: return@delete call.respond(HttpStatusCode.NotFound, mapOf("error" to "Session not found"))
                    
                    if (session.session.patientId != userId) {
                        return@delete call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                    }
                    
                    val deleted = ChatService.deleteSession(sessionId)
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Session deleted successfully"))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete session"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to e.message))
                }
            }
        }
    }
}
