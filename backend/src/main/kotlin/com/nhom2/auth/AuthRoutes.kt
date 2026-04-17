package com.nhom2.auth

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.authRoutes() {
    route("/auth") {

        post("/register") {
            try {
                val request = call.receive<RegisterRequest>()

                // Validation
                if (request.email.isBlank() || !request.email.contains("@")) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Email không hợp lệ"))
                    return@post
                }
                if (request.password.length < 8) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Mật khẩu tối thiểu 8 ký tự"))
                    return@post
                }

                val response = AuthService.register(request)
                call.respond(HttpStatusCode.Created, response)
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.Conflict, ErrorResponse(e.message ?: "Lỗi đăng ký"))
            }
        }

        post("/login") {
            try {
                val request = call.receive<LoginRequest>()
                val response = AuthService.login(request)
                call.respond(HttpStatusCode.OK, response)
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.Unauthorized, ErrorResponse(e.message ?: "Sai thông tin đăng nhập"))
            }
        }

        authenticate("auth-jwt") {
            get("/me") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.getClaim("userId", String::class)
                    ?: return@get call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Token không hợp lệ"))

                val user = AuthService.getUserById(userId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse("User không tồn tại"))

                call.respond(HttpStatusCode.OK, user)
            }
        }
    }
}