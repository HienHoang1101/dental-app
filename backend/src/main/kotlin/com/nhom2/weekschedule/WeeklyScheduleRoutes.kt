package com.nhom2.weekschedule

import com.nhom2.common.*
import com.nhom2.Security
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.LocalDate
import java.util.UUID

fun Route.weeklyScheduleRoutes() {
    
    // ══════════════════════════════════════════════════════════════════════════
    // Public Routes - Get schedules and available slots
    // ══════════════════════════════════════════════════════════════════════════
    
    /**
     * GET /api/doctors/{id}/weekly-schedules
     * Get weekly work schedules for a doctor
     */
    get("/doctors/{id}/weekly-schedules") {
        try {
            val doctorId = UUID.fromString(call.parameters["id"])
            val schedules = WeeklyScheduleService.getByDoctor(doctorId)
            
            call.respond(ApiResponse(
                success = true,
                data = schedules
            ))
        } catch (e: IllegalArgumentException) {
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                error = "Invalid doctor ID format",
                message = e.message ?: "Unknown error"
            ))
        } catch (e: Exception) {
            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                error = "Failed to fetch weekly schedules",
                message = e.message ?: "Unknown error"
            ))
        }
    }
    
    /**
     * GET /api/doctors/{id}/available-slots?date=YYYY-MM-DD
     * Get available time slots for a doctor on a specific date
     */
    get("/doctors/{id}/available-slots") {
        try {
            val doctorId = UUID.fromString(call.parameters["id"])
            val dateStr = call.request.queryParameters["date"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Missing date parameter",
                    message = "Please provide date in YYYY-MM-DD format"
                ))
            
            val date = try {
                LocalDate.parse(dateStr)
            } catch (e: Exception) {
                return@get call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                    error = "Invalid date format",
                    message = "Date must be in YYYY-MM-DD format"
                ))
            }
            
            val slots = WeeklyScheduleService.getAvailableSlots(doctorId, date)
            
            call.respond(ApiResponse(
                success = true,
                data = AvailableSlotsResponse(
                    date = dateStr,
                    doctorId = doctorId.toString(),
                    slots = slots
                )
            ))
        } catch (e: IllegalArgumentException) {
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                error = "Invalid doctor ID format",
                message = e.message ?: "Unknown error"
            ))
        } catch (e: Exception) {
            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                error = "Failed to fetch available slots",
                message = e.message ?: "Unknown error"
            ))
        }
    }
    
    // ══════════════════════════════════════════════════════════════════════════
    // Doctor Routes - Manage own schedules (creates change requests)
    // ══════════════════════════════════════════════════════════════════════════
    
    authenticate {
        /**
         * POST /api/doctor/weekly-schedules
         * Doctor creates a schedule change request (add new schedule)
         */
        post("/doctor/weekly-schedules") {
            try {
                println("DEBUG: POST /api/doctor/weekly-schedules called")
                
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                println("DEBUG: User ID: $userId, Role: $role")
                
                if (role != "doctor") {
                    return@post call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can create schedule requests"
                    ))
                }
                
                val doctorId = Security.getDoctorIdByUserId(userId)
                    ?: return@post call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                
                println("DEBUG: Doctor ID: $doctorId")
                
                val request = call.receive<CreateWeeklyScheduleRequest>()
                println("DEBUG: Request received: dayOfWeek=${request.dayOfWeek}, session=${request.session}, startTime=${request.startTime}, endTime=${request.endTime}")
                
                // Create schedule change request instead of directly creating schedule
                val scheduleData = ScheduleDataDTO(
                    dayOfWeek = request.dayOfWeek,
                    session = request.session,
                    startTime = request.startTime ?: if (request.session == "morning") "08:00" else "13:30",
                    endTime = request.endTime ?: if (request.session == "morning") "12:00" else "17:30"
                )
                
                println("DEBUG: Schedule data: $scheduleData")
                
                val changeRequest = com.nhom2.schedulechange.ScheduleChangeService.createRequest(
                    doctorId = doctorId,
                    request = CreateScheduleChangeRequest(
                        requestType = "add",
                        newScheduleData = scheduleData
                    )
                )
                
                println("DEBUG: Change request created successfully: ${changeRequest.id}")
                
                call.respond(HttpStatusCode.Created, ApiResponse(
                    success = true,
                    data = changeRequest,
                    message = "Schedule change request created. Waiting for admin approval."
                ))
            } catch (e: Exception) {
                println("ERROR: Exception in POST /api/doctor/weekly-schedules: ${e.message}")
                e.printStackTrace()
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to create schedule request",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * PUT /api/doctor/weekly-schedules/{id}
         * Doctor modifies a schedule (creates change request)
         */
        put("/doctor/weekly-schedules/{id}") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "doctor") {
                    return@put call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can modify schedules"
                    ))
                }
                
                val scheduleId = UUID.fromString(call.parameters["id"])
                val doctorId = Security.getDoctorIdByUserId(userId)
                    ?: return@put call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                
                val updateRequest = call.receive<UpdateWeeklyScheduleRequest>()
                
                // Get current schedule
                val currentSchedules = WeeklyScheduleService.getByDoctor(doctorId)
                val currentSchedule = currentSchedules.find { it.id == scheduleId.toString() }
                    ?: return@put call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Schedule not found",
                        message = "Schedule does not exist or does not belong to you"
                    ))
                
                // Create modification request
                val oldData = ScheduleDataDTO(
                    dayOfWeek = currentSchedule.dayOfWeek,
                    session = currentSchedule.session,
                    startTime = currentSchedule.startTime,
                    endTime = currentSchedule.endTime
                )
                
                val newData = ScheduleDataDTO(
                    dayOfWeek = currentSchedule.dayOfWeek,
                    session = currentSchedule.session,
                    startTime = updateRequest.startTime ?: currentSchedule.startTime,
                    endTime = updateRequest.endTime ?: currentSchedule.endTime
                )
                
                val changeRequest = com.nhom2.schedulechange.ScheduleChangeService.createRequest(
                    doctorId = doctorId,
                    request = CreateScheduleChangeRequest(
                        requestType = "modify",
                        oldScheduleData = oldData,
                        newScheduleData = newData
                    )
                )
                
                call.respond(ApiResponse(
                    success = true,
                    data = changeRequest,
                    message = "Schedule modification request created. Waiting for admin approval."
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to create modification request",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
        
        /**
         * DELETE /api/doctor/weekly-schedules/{id}
         * Doctor removes a schedule (creates change request)
         */
        delete("/doctor/weekly-schedules/{id}") {
            try {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal?.payload?.getClaim("userId")?.asString())
                val role = principal?.payload?.getClaim("role")?.asString()
                
                if (role != "doctor") {
                    return@delete call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                        error = "Access denied",
                        message = "Only doctors can remove schedules"
                    ))
                }
                
                val scheduleId = UUID.fromString(call.parameters["id"])
                val doctorId = Security.getDoctorIdByUserId(userId)
                    ?: return@delete call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Doctor profile not found",
                        message = "Please contact administrator"
                    ))
                
                // Get current schedule
                val currentSchedules = WeeklyScheduleService.getByDoctor(doctorId)
                val currentSchedule = currentSchedules.find { it.id == scheduleId.toString() }
                    ?: return@delete call.respond(HttpStatusCode.NotFound, ErrorResponse(
                        error = "Schedule not found",
                        message = "Schedule does not exist or does not belong to you"
                    ))
                
                // Create removal request
                val oldData = ScheduleDataDTO(
                    dayOfWeek = currentSchedule.dayOfWeek,
                    session = currentSchedule.session,
                    startTime = currentSchedule.startTime,
                    endTime = currentSchedule.endTime
                )
                
                val changeRequest = com.nhom2.schedulechange.ScheduleChangeService.createRequest(
                    doctorId = doctorId,
                    request = CreateScheduleChangeRequest(
                        requestType = "remove",
                        oldScheduleData = oldData
                    )
                )
                
                call.respond(ApiResponse(
                    success = true,
                    data = changeRequest,
                    message = "Schedule removal request created. Waiting for admin approval."
                ))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                    error = "Failed to create removal request",
                    message = e.message ?: "Unknown error"
                ))
            }
        }
    }
}
