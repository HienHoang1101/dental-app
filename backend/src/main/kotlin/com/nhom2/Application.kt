package com.nhom2

import com.nhom2.config.DatabaseConfig
import com.nhom2.plugins.configureRouting
import com.nhom2.plugins.configureSecurity
import com.nhom2.plugins.configureSerialization
import io.ktor.server.application.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    DatabaseConfig.init()
    configureSerialization()
    configureSecurity()
    configureRouting()
}



