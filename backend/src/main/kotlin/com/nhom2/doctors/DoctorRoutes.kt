package com.nhom2.doctors

import com.nhom2.common.ApiResponse
import com.nhom2.common.ErrorResponse
import com.nhom2.common.SupabaseDoctorDTO
import com.nhom2.common.CreateSupabaseDoctorRequest
import com.nhom2.common.UpdateSupabaseDoctorRequest
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.doctorRoutes() {
    route("/doctors") {
        // GET /api/doctors - Get all doctors with optional filters
        get {
            try {
                val specialtyId = call.request.queryParameters["specialtyId"]
                val activeOnly = call.request.queryParameters["activeOnly"]?.toBoolean() ?: true
                
                var doctors = SupabaseDoctorService.getAllDoctors(activeOnly)
                
                // Filter by specialty if provided
                if (!specialtyId.isNullOrBlank()) {
                    doctors = SupabaseDoctorService.getDoctorsBySpecialtyId(specialtyId, activeOnly)
                }
                
                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(success = true, data = doctors)
                )
            } catch (e: Exception) {
                call.application.environment.log.error("Error fetching doctors", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "INTERNAL_ERROR", message = "Failed to fetch doctors: ${e.message}")
                )
            }
        }

        // GET /api/doctors/{id} - Get doctor by ID
        get("/{id}") {
            try {
                val id = call.parameters["id"]?.let { UUID.fromString(it) }
                    ?: return@get call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "INVALID_ID", message = "Invalid doctor ID")
                    )

                val doctor = SupabaseDoctorService.getDoctorById(id)
                if (doctor == null) {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ErrorResponse(error = "NOT_FOUND", message = "Doctor not found")
                    )
                } else {
                    call.respond(
                        HttpStatusCode.OK,
                        ApiResponse(success = true, data = doctor)
                    )
                }
            } catch (e: Exception) {
                call.application.environment.log.error("Error fetching doctor", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "INTERNAL_ERROR", message = "Failed to fetch doctor: ${e.message}")
                )
            }
        }

        // POST /api/doctors - Create new doctor (admin only)
        post {
            try {
                val request = call.receive<CreateSupabaseDoctorRequest>()
                val doctor = SupabaseDoctorService.createDoctor(request)
                call.respond(
                    HttpStatusCode.Created,
                    ApiResponse(success = true, data = doctor)
                )
            } catch (e: Exception) {
                call.application.environment.log.error("Error creating doctor", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "INTERNAL_ERROR", message = "Failed to create doctor: ${e.message}")
                )
            }
        }

        // PUT /api/doctors/{id} - Update doctor (admin only)
        put("/{id}") {
            try {
                val id = call.parameters["id"]?.let { UUID.fromString(it) }
                    ?: return@put call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "INVALID_ID", message = "Invalid doctor ID")
                    )

                val request = call.receive<UpdateSupabaseDoctorRequest>()
                val doctor = SupabaseDoctorService.updateDoctor(id, request)
                
                if (doctor == null) {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ErrorResponse(error = "NOT_FOUND", message = "Doctor not found")
                    )
                } else {
                    call.respond(
                        HttpStatusCode.OK,
                        ApiResponse(success = true, data = doctor)
                    )
                }
            } catch (e: Exception) {
                call.application.environment.log.error("Error updating doctor", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "INTERNAL_ERROR", message = "Failed to update doctor: ${e.message}")
                )
            }
        }

        // DELETE /api/doctors/{id} - Soft delete doctor (admin only)
        delete("/{id}") {
            try {
                val id = call.parameters["id"]?.let { UUID.fromString(it) }
                    ?: return@delete call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "INVALID_ID", message = "Invalid doctor ID")
                    )

                val success = SupabaseDoctorService.deleteDoctor(id)
                if (success) {
                    call.respond(
                        HttpStatusCode.OK,
                        ApiResponse<Unit>(success = true, message = "Doctor deactivated successfully")
                    )
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ErrorResponse(error = "NOT_FOUND", message = "Doctor not found")
                    )
                }
            } catch (e: Exception) {
                call.application.environment.log.error("Error deleting doctor", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "INTERNAL_ERROR", message = "Failed to delete doctor: ${e.message}")
                )
            }
        }
    }
}
