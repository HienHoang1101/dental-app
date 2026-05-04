package com.nhom2.specialty

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.specialtyRoutes() {
    route("/specialties") {
        // Public: Get all active specialties
        get {
            try {
                val activeOnly = call.request.queryParameters["activeOnly"]?.toBoolean() ?: true
                val specialties = SpecialtyService.getAllSpecialties(activeOnly)
                call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = specialties))
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                )
            }
        }

        // Public: Get specialty by ID
        get("/{id}") {
            try {
                val id = UUID.fromString(call.parameters["id"])
                val specialty = SpecialtyService.getSpecialtyById(id)
                
                if (specialty != null) {
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = specialty))
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Specialty not found"))
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                )
            }
        }

        authenticate {
            // Admin: Create specialty
            post {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<CreateSpecialtyRequest>()
                    val specialty = SpecialtyService.createSpecialty(request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = specialty))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create specialty")
                    )
                }
            }

            // Admin: Update specialty
            put("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateSpecialtyRequest>()
                    val specialty = SpecialtyService.updateSpecialty(id, request)
                    
                    if (specialty != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = specialty))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Specialty not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update specialty")
                    )
                }
            }

            // Admin: Delete specialty
            delete("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@delete
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val deleted = SpecialtyService.deleteSpecialty(id)
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Specialty deleted successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Specialty not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "DELETE_FAILED", message = e.message ?: "Failed to delete specialty")
                    )
                }
            }
        }
    }
}
