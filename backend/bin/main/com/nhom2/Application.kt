package com.nhom2

import com.nhom2.config.DatabaseConfig
import com.nhom2.plugins.*
// import com.nhom2.utils.SeedData // DISABLED: Using Supabase data
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.routing.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    DatabaseConfig.init()
    
    // CORS — cho phép frontend Next.js gọi API
    install(CORS) {
        allowHost("localhost:3000")
        allowHost("localhost:3001")
        allowHost("127.0.0.1:3000")
        allowHost("127.0.0.1:3001")
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Patch)
        allowCredentials = true
    }

    configureSerialization()
    configureSecurity()
    configureRouting()
}