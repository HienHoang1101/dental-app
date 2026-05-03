package com.nhom2.patient

import com.nhom2.auth.ErrorResponse
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.profileRoutes() {
    authenticate("auth-jwt") {
        route("/profile") {

            get {
                val userId = call.principal<JWTPrincipal>()
                    ?.getClaim("userId", String::class)
                    ?: return@get call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Token không hợp lệ"))

                val profile = ProfileService.getProfile(userId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse("Không tìm thấy hồ sơ"))

                call.respond(HttpStatusCode.OK, profile)
            }

            put {
                val userId = call.principal<JWTPrincipal>()
                    ?.getClaim("userId", String::class)
                    ?: return@put call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Token không hợp lệ"))

                val request = call.receive<UpdateProfileRequest>()

                // Validate gender
                if (request.gender != null && request.gender !in listOf("male", "female", "other")) {
                    return@put call.respond(HttpStatusCode.BadRequest, ErrorResponse("Gender phải là: male, female, hoặc other"))
                }

                // Validate date format
                if (request.dateOfBirth != null) {
                    try {
                        java.time.LocalDate.parse(request.dateOfBirth)
                    } catch (e: Exception) {
                        return@put call.respond(HttpStatusCode.BadRequest, ErrorResponse("dateOfBirth phải đúng format: yyyy-MM-dd"))
                    }
                }

                val updated = ProfileService.updateProfile(userId, request)
                    ?: return@put call.respond(HttpStatusCode.NotFound, ErrorResponse("Không tìm thấy hồ sơ"))

                call.respond(HttpStatusCode.OK, updated)
            }
        }
    }
}