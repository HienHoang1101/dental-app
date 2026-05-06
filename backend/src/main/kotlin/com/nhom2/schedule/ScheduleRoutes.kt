package com.nhom2.schedule

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.LocalDate
import java.util.UUID

fun Route.scheduleRoutes() {
    route("/schedules") {
        authenticate {
            // Admin: Create shift
            post("/shifts") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<CreateShiftRequest>()
                    val shift = ScheduleService.createShift(request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = shift))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create shift")
                    )
                }
            }

            // Get all shifts
            get("/shifts") {
                try {
                    val shifts = ScheduleService.getAllShifts()
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = shifts))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin: Update shift
            put("/shifts/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<UpdateShiftRequest>()
                    val shift = ScheduleService.updateShift(id, request)
                    
                    if (shift != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = shift))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Shift not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to update shift")
                    )
                }
            }

            // Admin: Delete shift
            delete("/shifts/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@delete
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val deleted = ScheduleService.deleteShift(id)
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Shift deleted successfully"))
                    } else {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ErrorResponse(error = "DELETE_FAILED", message = "Cannot delete shift with existing work schedules")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin: Create work schedule
            post("/work-schedules") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<CreateWorkScheduleRequest>()
                    val result = ScheduleService.createWorkSchedule(request)
                    
                    result.onSuccess { schedule ->
                        call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = schedule))
                    }.onFailure { error ->
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ErrorResponse(error = "CREATE_FAILED", message = error.message ?: "Failed to create work schedule")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get work schedules (admin can get all, or filter by date/doctor)
            get("/work-schedules") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val date = call.request.queryParameters["date"]?.let { LocalDate.parse(it) }
                    val doctorId = call.request.queryParameters["doctorId"]?.let { UUID.fromString(it) }
                    
                    val schedules = ScheduleService.getWorkSchedules(date, doctorId)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = schedules))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get work schedules by doctor
            get("/work-schedules/doctor/{doctorId}") {
                try {
                    val doctorId = UUID.fromString(call.parameters["doctorId"])
                    val startDate = call.request.queryParameters["startDate"]?.let { LocalDate.parse(it) }
                    val endDate = call.request.queryParameters["endDate"]?.let { LocalDate.parse(it) }
                    
                    val schedules = ScheduleService.getWorkSchedulesByDoctor(doctorId, startDate, endDate)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = schedules))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Get available time slots
            get("/available-slots") {
                try {
                    val doctorId = UUID.fromString(call.request.queryParameters["doctorId"]!!)
                    val date = LocalDate.parse(call.request.queryParameters["date"]!!)
                    
                    call.application.environment.log.info("Getting available slots for doctor: $doctorId, date: $date")
                    
                    val slots = ScheduleService.getAvailableTimeSlots(doctorId, date)
                    
                    call.application.environment.log.info("Found ${slots.size} available slots")
                    
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = slots))
                } catch (e: Exception) {
                    call.application.environment.log.error("Error getting available slots", e)
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse(error = "INVALID_REQUEST", message = "doctorId and date are required: ${e.message}")
                    )
                }
            }

            // Admin: Delete work schedule
            delete("/work-schedules/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@delete
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val deleted = ScheduleService.deleteWorkSchedule(id)
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Work schedule deleted successfully"))
                    } else {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ErrorResponse(error = "DELETE_FAILED", message = "Cannot delete work schedule with existing appointments")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin: Create holiday
            post("/holidays") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val request = call.receive<CreateHolidayRequest>()
                    val holiday = ScheduleService.createHoliday(request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = holiday))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create holiday")
                    )
                }
            }

            // Get all holidays
            get("/holidays") {
                try {
                    val holidays = ScheduleService.getAllHolidays()
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = holidays))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin: Delete holiday
            delete("/holidays/{id}") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@delete
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val deleted = ScheduleService.deleteHoliday(id)
                    
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, ApiResponse<Unit>(success = true, message = "Holiday deleted successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Holiday not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "DELETE_FAILED", message = e.message ?: "Failed to delete holiday")
                    )
                }
            }

            // Doctor: Create leave request
            post("/leave-requests") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@post
                    }

                    val doctor = com.nhom2.doctors.SupabaseDoctorService.getDoctorByUserId(userId)
                    if (doctor == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                        return@post
                    }

                    val request = call.receive<CreateLeaveRequestRequest>()
                    val leaveRequest = ScheduleService.createLeaveRequest(UUID.fromString(doctor.id), request)
                    call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = leaveRequest))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "CREATE_FAILED", message = e.message ?: "Failed to create leave request")
                    )
                }
            }

            // Doctor: Get own leave requests
            get("/leave-requests/my") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "doctor") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val doctor = com.nhom2.doctors.SupabaseDoctorService.getDoctorByUserId(userId)
                    if (doctor == null) {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Doctor profile not found"))
                        return@get
                    }

                    val leaveRequests = ScheduleService.getLeaveRequestsByDoctor(UUID.fromString(doctor.id))
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = leaveRequests))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin: Get all leave requests
            get("/leave-requests") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val status = call.request.queryParameters["status"]
                    val leaveRequests = ScheduleService.getAllLeaveRequests(status)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = leaveRequests))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "SERVER_ERROR", message = e.message ?: "An error occurred")
                    )
                }
            }

            // Admin: Review leave request
            put("/leave-requests/{id}/review") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("userId").asString())
                    val role = principal.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@put
                    }

                    val id = UUID.fromString(call.parameters["id"])
                    val request = call.receive<ReviewLeaveRequestRequest>()
                    val leaveRequest = ScheduleService.reviewLeaveRequest(id, userId, request)
                    
                    if (leaveRequest != null) {
                        call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = leaveRequest))
                    } else {
                        call.respond(HttpStatusCode.NotFound, ErrorResponse(error = "NOT_FOUND", message = "Leave request not found"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(error = "UPDATE_FAILED", message = e.message ?: "Failed to review leave request")
                    )
                }
            }
        }
    }
}
