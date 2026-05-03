package com.nhom2.service

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object ServiceTable : Table("services") {
    val id = uuid("id").autoGenerate()
    val name = text("name")
    val description = text("description").nullable()
    val price = integer("price")
    val durationMinutes = integer("duration_minutes").default(30)
    val category = text("category").nullable()
    val isActive = bool("is_active").default(true)
    val createdAt = datetime("created_at").default(LocalDateTime.now())

    override val primaryKey = PrimaryKey(id)
}