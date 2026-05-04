package com.nhom2.doctors

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.doctorRoutes() {
    route("/doctors") {
        // Public: Get all active doctors
        get {
            try {
                val activeOnly = call.request.queryParameters["activeOnly"]?.toBoolean() ?: true
                val doctors = DoctorService.getAllDoctors(activeOnly)
                call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctors))
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                )
            }
        }

        // Public: Search/filter doctors
        post("/search") {
            try {
                val filter = call.receive<DoctorFilterRequest>()
                val doctors = DoctorService.searchDoctors(filter)
                call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctors))
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                )
            }
        }

        // Public: Get doctor by ID
        get("/{id}") {
            try {
                val id = UUID.fromString(call.parameters["id"])
                val doctor = DoctorService.getDoctorById(id)
                
                if (doctor != null) {
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctor))
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor not found"))
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                )
            }
        }

        authenticate {
            // Doctor: Get own profile
            get("/me") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val doctor = DoctorService.getDoctorByUserId(userId)
                    if (doctor != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctor))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Doctor: Update own profile
            put("/me") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val doctor = DoctorService.getDoctorByUserId(userId)
                    if (doctor == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                        return@put
                    }

                    val request = call.receive<UpdateDoctorRequest>()
                    val updated = DoctorService.updateDoctor(UUID.fromString(doctor.id), request)
                    
                    if (updated != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = updated))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update doctor profile")
                    )
                }
            }

            // Admin: Create doctor
            post {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<CreateDoctorRequest>()
                    val doctor = DoctorService.createDoctor(request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = doctor))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create doctor")
                    )
                }
            }

            // Admin: Update doctor
            put("/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateDoctorRequest>()
                    val doctor = DoctorService.updateDoctor(id, request)
                    
                    if (doctor != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = doctor))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update doctor")
                    )
                }
            }
        }
    }
}
