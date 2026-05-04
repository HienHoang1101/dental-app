package com.nhom2.doctor

import com.nhom2.common.*
import com.nhom2.appointment.AppointmentService
import com.nhom2.doctors.DoctorService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.util.UUID

fun Route.doctorApiRoutes() {
    route("/doctor") {
        authenticate {
            // Get doctor profile
            get("/profile") {
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

            // Get dashboard stats
            get("/dashboard/stats") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val doctor = DoctorService.getDoctorByUserId(userId)
                    if (doctor == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                        return@get
                    }

                    val doctorId = UUID.fromString(doctor.id)
                    val today = LocalDate.now()
                    
                    val stats = transaction {
                        val allAppointments = AppointmentService.getAppointmentsByDoctor(doctorId)
                        
                        val todayAppointments = allAppointments.count { 
                            it.appointmentDate == today.toString()
                        }
                        
                        val upcomingAppointments = allAppointments.count { 
                            val aptDate = LocalDate.parse(it.appointmentDate)
                            aptDate.isAfter(today) && aptDate.isBefore(today.plusWeeks(1))
                        }
                        
                        val completedToday = allAppointments.count { 
                            it.appointmentDate == today.toString() && it.status == "completed"
                        }
                        
                        val uniquePatients = allAppointments
                            .filter { it.status == "completed" }
                            .map { it.patient.id }
                            .toSet()
                            .size
                        
                        mapOf(
                            "todayAppointments" to todayAppointments,
                            "upcomingAppointments" to upcomingAppointments,
                            "completedToday" to completedToday,
                            "totalPatients" to uniquePatients
                        )
                    }
                    
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = stats))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get appointments
            get("/appointments") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val doctor = DoctorService.getDoctorByUserId(userId)
                    if (doctor == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                        return@get
                    }

                    val status = call.request.queryParameters["status"]
                    val date = call.request.queryParameters["date"]
                    
                    var appointments = AppointmentService.getAppointmentsByDoctor(UUID.fromString(doctor.id), status)
                    
                    // Filter by date if provided
                    date?.let {
                        appointments = appointments.filter { apt -> apt.appointmentDate == it }
                    }
                    
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointments))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get appointment detail
            get("/appointments/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val doctor = DoctorService.getDoctorByUserId(userId)
                    if (doctor == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                        return@get
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val appointment = AppointmentService.getAppointmentById(id)
                    
                    if (appointment == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Appointment not found"))
                        return@get
                    }

                    // Check if appointment belongs to this doctor
                    if (appointment.doctor.id != doctor.id) {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = appointment))
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
