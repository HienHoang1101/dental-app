package com.nhom2.services

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.serviceRoutes() {
    route("/services") {
        // Public: Get all active services
        get {
            try {
                val activeOnly = call.request.queryParameters["activeOnly"]?.toBoolean() ?: true
                val services = ServiceService.getAllServices(activeOnly)
                call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = services))
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                )
            }
        }

        // Public: Get service by ID
        get("/{id}") {
            try {
                val id = UUID.fromString(call.parameters["id"])
                val service = ServiceService.getServiceById(id)
                
                if (service != null) {
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = service))
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Service not found"))
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                )
            }
        }

        authenticate {
            // Admin: Create service
            post {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<CreateServiceRequest>()
                    val service = ServiceService.createService(request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = service))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create service")
                    )
                }
            }

            // Admin: Update service
            put("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateServiceRequest>()
                    val service = ServiceService.updateService(id, request)
                    
                    if (service != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = service))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Service not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update service")
                    )
                }
            }

            // Admin: Delete service
            delete("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@delete
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val deleted = ServiceService.deleteService(id)
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Service deleted successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Service not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "DELETE_FAILED", message = e.message ?: "Failed to delete service")
                    )
                }
            }
        }
    }
}
