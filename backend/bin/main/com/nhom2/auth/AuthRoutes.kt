package com.nhom2.auth

import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.authRoutes() {
    route("/auth") {
        post("/register") {
            try {
                val request = call.receive<RegisterRequest>()
                val response = AuthService.register(request)
                call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = response))
            } catch (e: IllegalArgumentException) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(error = "REGISTRATION_FAILED", message = e.message ?: "Registration failed")
                )
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = "An error occurred during registration")
                )
            }
        }

        post("/login") {
            try {
                val request = call.receive<LoginRequest>()
                val response = AuthService.login(request)
                call.respond(HttpStatusCode.OK, ApiResponse(success = true, data = response))
            } catch (e: IllegalArgumentException) {
                call.respond(
                    HttpStatusCode.Unauthorized,
                    ErrorResponse(error = "LOGIN_FAILED", message = e.message ?: "Login failed")
                )
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = "An error occurred during login")
                )
            }
        }
    }
}
