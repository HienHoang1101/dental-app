package com.nhom2

import com.nhom2.config.DatabaseConfig
import com.nhom2.plugins.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    DatabaseConfig.init()

    // CORS — cho phép frontend Next.js gọi API
    install(CORS) {
        allowHost("localhost:3000")
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
    }

    configureSerialization()
    configureSecurity()
    configureRouting()
}



