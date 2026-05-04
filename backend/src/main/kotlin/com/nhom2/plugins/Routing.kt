package com.nhom2.plugins

import com.nhom2.auth.authRoutes
import com.nhom2.healthrecord.healthRecordRoutes
import com.nhom2.specialty.specialtyRoutes
import com.nhom2.doctors.doctorRoutes
import com.nhom2.doctor.doctorApiRoutes
import com.nhom2.admin.adminApiRoutes
import com.nhom2.services.serviceRoutes
import com.nhom2.appointment.appointmentRoutes
import com.nhom2.schedule.scheduleRoutes
import com.nhom2.notification.notificationRoutes
import com.nhom2.dashboard.dashboardRoutes
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Dental Appointment System API is running!")
        }

        get("/health") {
            call.respondText("OK")
        }

        // Register all routes under /api prefix
        route("/api") {
            authRoutes()
            healthRecordRoutes()
            specialtyRoutes()
            doctorRoutes()
            doctorApiRoutes()
            adminApiRoutes()
            serviceRoutes()
            appointmentRoutes()
            scheduleRoutes()
            notificationRoutes()
            dashboardRoutes()
        }
    }
}
