package com.nhom2.service

import com.nhom2.auth.ErrorResponse
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.serviceRoutes(serviceService: ServiceService) {
    // ── PUBLIC: Bệnh nhân xem danh sách dịch vụ ─────────────
    authenticate("auth-jwt") {
        // GET /services — danh sách dịch vụ active
        get("/services") {
            val services = serviceService.getActiveServices()
            call.respond(services)
        }

        // GET /services/{id} — chi tiết dịch vụ
        get("/services/{id}") {
            val id = call.parameters["id"]?.let {
                try { UUID.fromString(it) } catch (e: Exception) { null }
            }
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("ID không hợp lệ"))
                return@get
            }

            val service = serviceService.getServiceById(id)
            if (service == null || !service.isActive) {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Không tìm thấy dịch vụ"))
                return@get
            }
            call.respond(service)
        }
    }
}

fun Route.adminServiceRoutes(serviceService: ServiceService) {
    authenticate("auth-jwt") {
        route("/admin/services") {
            // GET /admin/services — tất cả dịch vụ (kể cả inactive)
            get {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                if (role != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Chỉ admin mới có quyền truy cập"))
                    return@get
                }

                val services = serviceService.getAllServices()
                call.respond(services)
            }

            // POST /admin/services — thêm dịch vụ mới
            post {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                if (role != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Chỉ admin mới có quyền truy cập"))
                    return@post
                }

                val request = call.receive<CreateServiceRequest>()

                // Validate
                if (request.name.isBlank()) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Tên dịch vụ không được để trống"))
                    return@post
                }
                if (request.price <= 0) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Giá phải là số nguyên dương"))
                    return@post
                }
                if (request.durationMinutes <= 0) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Thời lượng phải lớn hơn 0"))
                    return@post
                }

                val service = serviceService.createService(request)
                call.respond(HttpStatusCode.Created, service)
            }

            // PUT /admin/services/{id} — cập nhật dịch vụ
            put("/{id}") {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                if (role != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Chỉ admin mới có quyền truy cập"))
                    return@put
                }

                val id = call.parameters["id"]?.let {
                    try { UUID.fromString(it) } catch (e: Exception) { null }
                }
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("ID không hợp lệ"))
                    return@put
                }

                val request = call.receive<UpdateServiceRequest>()

                // Validate price nếu có
                request.price?.let { p ->
                    if (p <= 0) {
                        call.respond(HttpStatusCode.BadRequest, ErrorResponse("Giá phải là số nguyên dương"))
                        return@put
                    }
                }

                val updated = serviceService.updateService(id, request)
                if (updated != null) {
                    call.respond(updated)
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Không tìm thấy dịch vụ"))
                }
            }
        }
    }
}
