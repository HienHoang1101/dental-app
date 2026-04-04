package com.nhom2.config

import io.github.cdimascio.dotenv.dotenv
import org.jetbrains.exposed.sql.Database

object DatabaseConfig {
    fun init() {
        val env = dotenv { ignoreIfMissing = true }

        Database.connect(
            url = env["DATABASE_URL"],
            driver = "org.postgresql.Driver",
            user = env["DATABASE_USER"],
            password = env["DATABASE_PASSWORD"]
        )
        println("Database connected successfully")
    }
}
