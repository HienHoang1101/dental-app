package com.nhom2.healthrecord

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.healthRecordRoutes() {
    route("/health-records") {
        authenticate {
            // Create health record for current user
            post {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val request = call.receive<CreateHealthRecordRequest>()
                    
                    val healthRecord = HealthRecordService.createHealthRecord(userId, request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = healthRecord))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create health record")
                    )
                }
            }

            // Get current user's health record
            get("/me") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    
                    val healthRecord = HealthRecordService.getHealthRecordByUserId(userId)
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

            // Update current user's health record
            put("/me") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val request = call.receive<UpdateHealthRecordRequest>()
                    
                    val healthRecord = HealthRecordService.updateHealthRecord(userId, request)
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

            // Admin/Doctor: Get all health records
            get {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role !in listOf("admin", "doctor")) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                    val pageSize = call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 20
                    
                    val result = HealthRecordService.getAllHealthRecords(page, pageSize)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = result))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin/Doctor: Get health record by ID
            get("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role !in listOf("admin", "doctor")) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val healthRecord = HealthRecordService.getHealthRecordById(id)
                    
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

            // Admin: Search health records
            get("/search") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val query = call.request.queryParameters["q"] ?: ""
                    val results = HealthRecordService.searchHealthRecords(query)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = results))
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
