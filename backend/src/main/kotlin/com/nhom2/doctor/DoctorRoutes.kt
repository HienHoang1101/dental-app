package com.nhom2.doctor

import com.nhom2.auth.ErrorResponse
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

/**
 * Định nghĩa các API endpoints (routes) liên quan đến Bác sĩ dành cho ứng dụng (thường là bệnh nhân sử dụng).
 * Các API này yêu cầu client phải gửi kèm JWT token hợp lệ (đã đăng nhập).
 */
fun Route.doctorRoutes(doctorService: DoctorService) {

    // ── PUBLIC: Bệnh nhân xem danh sách bác sĩ ──────────────
    // Khối authenticate("auth-jwt") đảm bảo tất cả các API bên trong đều phải có token hợp lệ
    authenticate("auth-jwt") {
        // GET /doctors — Lấy danh sách các bác sĩ đang hoạt động (isActive = true)
        // Dùng để hiển thị danh sách bác sĩ trên ứng dụng cho bệnh nhân lựa chọn khi đặt lịch.
        get("/doctors") {
            val doctors = doctorService.getActiveDoctors()
            call.respond(doctors)
        }

        // GET /doctors/{id} — Lấy thông tin chi tiết của một bác sĩ cụ thể dựa trên ID.
        get("/doctors/{id}") {
            // Lấy tham số 'id' từ đường dẫn URL (vd: /doctors/123e4567-e89b-12d3-a456-426614174000)
            // và thử chuyển đổi (parse) chuỗi đó thành kiểu dữ liệu UUID.
            val id = call.parameters["id"]?.let {
                try { UUID.fromString(it) } catch (e: Exception) { null }
            }
            // Nếu parse thất bại (id truyền vào không phải UUID hợp lệ), trả về lỗi 400 Bad Request.
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("ID không hợp lệ"))
                return@get
            }

            // Gọi xuống tầng Service để lấy thông tin bác sĩ từ cơ sở dữ liệu.
            val doctor = doctorService.getDoctorById(id)
            // Bệnh nhân chỉ được xem thông tin bác sĩ nếu bác sĩ đó tồn tại và đang hoạt động (isActive = true).
            // Nếu không thỏa mãn, trả về lỗi 404 Not Found.
            if (doctor == null || !doctor.isActive) {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Không tìm thấy bác sĩ"))
                return@get
            }
            
            // Trả về dữ liệu chi tiết của bác sĩ.
            call.respond(doctor)
        }
    }
}

/**
 * Định nghĩa các API endpoints quản lý Bác sĩ dành riêng cho Admin (Trang quản trị).
 * Yêu cầu người dùng không chỉ đăng nhập, mà còn phải có quyền "admin".
 */
fun Route.adminDoctorRoutes(doctorService: DoctorService) {

    // Khối authenticate("auth-jwt") yêu cầu token hợp lệ.
    authenticate("auth-jwt") {
        // Gom nhóm tất cả các API quản trị bác sĩ dưới path chung là /admin/doctors
        route("/admin/doctors") {

            // GET /admin/doctors — Lấy danh sách TOÀN BỘ bác sĩ (bao gồm cả đang hoạt động và đã nghỉ việc)
            get {
                // Trích xuất thông tin người dùng (principal) từ JWT token đã được xác thực
                val principal = call.principal<JWTPrincipal>()
                // Lấy giá trị của trường "role" (vai trò) mà ta đã nhúng vào token lúc đăng nhập
                val role = principal?.payload?.getClaim("role")?.asString()
                
                // Phân quyền (Authorization): Nếu role không phải là "admin", từ chối truy cập (403 Forbidden).
                if (role != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Chỉ admin mới có quyền truy cập"))
                    return@get
                }

                // Gọi Service lấy tất cả bác sĩ và trả về cho client
                val doctors = doctorService.getAllDoctors()
                call.respond(doctors)
            }

            // POST /admin/doctors — Thêm/Tạo mới một hồ sơ bác sĩ
            post {
                // Kiểm tra phân quyền: Chỉ cho phép admin tạo mới
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                if (role != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Chỉ admin mới có quyền truy cập"))
                    return@post
                }

                // Đọc dữ liệu từ body của HTTP Request. 
                // Ktor sẽ tự động parse JSON body thành object CreateDoctorRequest nhờ plugin ContentNegotiation (Serialization).
                val request = call.receive<CreateDoctorRequest>()

                // Xác thực dữ liệu đầu vào (Validation cơ bản)
                // Đảm bảo tên bác sĩ và chuyên khoa không được để trống.
                if (request.fullName.isBlank()) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Tên bác sĩ không được để trống"))
                    return@post
                }
                if (request.specialty.isBlank()) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Chuyên khoa không được để trống"))
                    return@post
                }

                // Chuyển dữ liệu hợp lệ xuống tầng Service để thêm vào Database
                val doctor = doctorService.createDoctor(request)
                // Trả về thông tin bác sĩ vừa tạo kèm HTTP Status 201 (Created) - chỉ định tạo tài nguyên thành công.
                call.respond(HttpStatusCode.Created, doctor)
            }

            // PUT /admin/doctors/{id} — Cập nhật thông tin của một bác sĩ đã có
            put("/{id}") {
                // Kiểm tra phân quyền: Chỉ admin mới được quyền sửa thông tin
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()
                if (role != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Chỉ admin mới có quyền truy cập"))
                    return@put
                }

                // Lấy và kiểm tra ID từ tham số URL tương tự như API GET chi tiết
                val id = call.parameters["id"]?.let {
                    try { UUID.fromString(it) } catch (e: Exception) { null }
                }
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("ID không hợp lệ"))
                    return@put
                }

                // Đọc dữ liệu cập nhật từ body request (JSON -> UpdateDoctorRequest)
                val request = call.receive<UpdateDoctorRequest>()
                
                // Chuyển ID và dữ liệu mới xuống Service để cập nhật Database
                val updated = doctorService.updateDoctor(id, request)

                // Nếu cập nhật thành công (tìm thấy ID), trả về bản ghi đã cập nhật.
                // Nếu trả về null nghĩa là không tìm thấy bác sĩ với ID đó -> báo lỗi 404 Not Found.
                if (updated != null) {
                    call.respond(updated)
                } else {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Không tìm thấy bác sĩ"))
                }
            }
        }
    }
}
