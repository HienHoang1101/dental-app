package com.nhom2.dashboard

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.LocalDate

fun Route.dashboardRoutes() {
    route("/dashboard") {
        authenticate {
            // Admin: Get dashboard statistics
            get("/stats") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val role = principal!!.payload.getClaim("role").asString()
                    
                    if (role != "admin") {
                        call.respond(HttpStatusCode.Forbidden, ErrorResponse(error = "FORBIDDEN", message = "Access denied"))
                        return@get
                    }

                    val startDate = call.request.queryParameters["startDate"]?.let { LocalDate.parse(it) }
                    val endDate = call.request.queryParameters["endDate"]?.let { LocalDate.parse(it) }
                    
                    val stats = DashboardService.getDashboardStats(startDate, endDate)
                    call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = stats))
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
