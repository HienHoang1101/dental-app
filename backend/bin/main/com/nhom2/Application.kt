package com.nhom2

import com.nhom2.config.DatabaseConfig
import com.nhom2.plugins.*
<<<<<<< HEAD
import com.nhom2.utils.SeedData
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*
=======
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.*
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
import io.ktor.server.routing.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    DatabaseConfig.init()

<<<<<<< HEAD
    // Seed initial data (only runs once)
    val shouldSeed = environment.config.propertyOrNull("app.seedData")?.getString()?.toBoolean() ?: false
    if (shouldSeed) {
        SeedData.seed()
    }

    // CORS — cho phép frontend Next.js gọi API
    install(CORS) {
        allowHost("localhost:3000")
        allowHost("127.0.0.1:3000")
=======
    // CORS — cho phép frontend Next.js gọi API
    install(CORS) {
        allowHost("localhost:3000")
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
<<<<<<< HEAD
        allowMethod(HttpMethod.Patch)
        allowCredentials = true
=======
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
    }

    configureSerialization()
    configureSecurity()
    configureRouting()
}