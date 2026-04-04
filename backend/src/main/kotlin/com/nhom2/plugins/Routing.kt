package com.nhom2.plugins

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        get("/health"){
            call.respondText { "Dental Backend is running - Phase 0 OK" }
        }
    }
}

