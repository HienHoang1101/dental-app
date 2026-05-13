package com.nhom2.prescription

import com.nhom2.common.*
import com.nhom2.models.SupabaseDoctors
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.*

fun Route.prescriptionRoutes() {
    route("/medications") {
        authenticate {
            // GET /api/medications
            get {
                try {
                    val activeOnly = call.request.queryParameters["activeOnly"]?.toBoolean() ?: false
                    val medications = PrescriptionService.getAllMedications(activeOnly)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = medications))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred"))
                }
            }

            // POST /api/medications (Admin only)
            post {
                val principal = call.principal<JWTPrincipal>()
                if (principal?.payload?.getClaim("role")?.asString() != "admin") {
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Admin access required"))
                }
                try {
                    val request = call.receive<CreateMedicationRequest>()
                    val medication = PrescriptionService.createMedication(request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = medication))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred"))
                }
            }

            // PUT /api/medications/{id} (Admin only)
            put("/{id}") {
                val principal = call.principal<JWTPrincipal>()
                if (principal?.payload?.getClaim("role")?.asString() != "admin") {
                    return@put call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Admin access required"))
                }
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateMedicationRequest>()
                    val medication = PrescriptionService.updateMedication(id, request)
                    if (medication != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = medication))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Medication not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred"))
                }
            }

            // DELETE /api/medications/{id} (Admin only)
            delete("/{id}") {
                val principal = call.principal<JWTPrincipal>()
                if (principal?.payload?.getClaim("role")?.asString() != "admin") {
                    return@delete call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Admin access required"))
                }
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val deleted = PrescriptionService.deleteMedication(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Nothing?>(success = true, message = "Medication deleted"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Medication not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred"))
                }
            }
        }
    }

    route("/prescriptions") {
        authenticate {
            // GET /api/prescriptions (Admin/Doctor)
            get {
                try {
                    val prescriptions = PrescriptionService.getAllPrescriptions()
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = prescriptions))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred"))
                }
            }

            // GET /api/prescriptions/{id}
            get("/{id}") {
                try {
                    val id = UUID.fromString(call.parameters["id"])
                    val prescription = PrescriptionService.getPrescriptionById(id)
                    if (prescription != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = prescription))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Prescription not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred"))
                }
            }

            // POST /api/prescriptions (Doctor only)
            post {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                val userId = principal?.payload?.getClaim("userId")?.asString()
                
                if (role != "doctor") {
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Doctor access required"))
                }
                
                try {
                    val request = call.receive<CreatePrescriptionRequest>()
                    
                    // Find doctor profile for this user
                    val doctorId = transaction {
                        SupabaseDoctors.select { SupabaseDoctors.userId eq UUID.fromString(userId) }
                            .map { it[SupabaseDoctors.id] }
                            .singleOrNull()
                    } ?: return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "DOCTOR_PROFILE_NOT_FOUND", message = "Doctor profile not found for user"))

                    val prescription = PrescriptionService.createPrescription(request, doctorId)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = prescription))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred"))
                }
            }
        }
    }
}
