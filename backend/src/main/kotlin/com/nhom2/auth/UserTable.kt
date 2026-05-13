package com.nhom2.auth

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object UserTable : Table("users") {
    val id = uuid("id").autoGenerate()
    val email = text("email")
    val passwordHash = text("password_hash").nullable()
    val fullName = text("full_name")
    val phone = text("phone").nullable()
    val role = text("role").default("patient")
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")

    override val primaryKey = PrimaryKey(id)
}