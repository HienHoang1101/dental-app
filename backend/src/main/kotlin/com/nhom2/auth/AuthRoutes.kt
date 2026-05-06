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
                    ErrorResponse(error = "REGISTRATION_FAILED", message = e.message ?: "Đăng ký thất bại")
                )
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại sau.")
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
                    ErrorResponse(error = "LOGIN_FAILED", message = e.message ?: "Đăng nhập thất bại")
                )
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(error = "SERVER_ERROR", message = "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau.")
                )
            }
        }
    }
}
