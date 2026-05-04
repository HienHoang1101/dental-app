package com.nhom2.auth

<<<<<<< HEAD
import com.nhom2.common.*
import io.ktor.http.*
import io.ktor.server.application.*
=======
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.authRoutes() {
    route("/auth") {
<<<<<<< HEAD
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
=======

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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
            }
        }

        post("/login") {
            try {
                val request = call.receive<LoginRequest>()
                val response = AuthService.login(request)
<<<<<<< HEAD
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
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
