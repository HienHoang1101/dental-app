package com.nhom2.plugins

import com.nhom2.auth.authRoutes
<<<<<<< HEAD
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
=======
import com.nhom2.doctor.DoctorService
import com.nhom2.doctor.adminDoctorRoutes
import com.nhom2.doctor.doctorRoutes
import com.nhom2.patient.profileRoutes
import com.nhom2.service.ServiceService
import com.nhom2.service.adminServiceRoutes
import com.nhom2.service.serviceRoutes
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
<<<<<<< HEAD
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
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
