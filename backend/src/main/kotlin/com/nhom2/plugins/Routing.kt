package com.nhom2.plugins

import com.nhom2.auth.authRoutes
import com.nhom2.patient.profileRoutes
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        get("/health") {
            call.respondText("Dental Backend is running - Phase 1 OK")
        }

        authRoutes()
        profileRoutes()
    }
}