package com.nhom2.plugins

import com.nhom2.auth.authRoutes
import com.nhom2.doctor.DoctorService
import com.nhom2.doctor.adminDoctorRoutes
import com.nhom2.doctor.doctorRoutes
import com.nhom2.patient.profileRoutes
import com.nhom2.service.ServiceService
import com.nhom2.service.adminServiceRoutes
import com.nhom2.service.serviceRoutes
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    val doctorService = DoctorService()
    val serviceService = ServiceService()
    routing {
        get("/health") {
            call.respondText("Dental Backend is running - Phase 1 OK")
        }

        authRoutes()
        profileRoutes()

        // Public routes (bệnh nhân xem)
        doctorRoutes(doctorService)
        serviceRoutes(serviceService)

        // Admin routes (CRUD)
        adminDoctorRoutes(doctorService)
        adminServiceRoutes(serviceService)
    }
}