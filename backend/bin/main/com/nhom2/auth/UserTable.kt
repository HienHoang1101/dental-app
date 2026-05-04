package com.nhom2.auth

import org.jetbrains.exposed.sql.Table
<<<<<<< HEAD
import org.jetbrains.exposed.sql.javatime.timestamp
=======
import org.jetbrains.exposed.sql.javatime.datetime
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

object UserTable : Table("users") {
    val id = uuid("id").autoGenerate()
    val email = text("email")
    val passwordHash = text("password_hash").nullable()
    val fullName = text("full_name")
    val phone = text("phone").nullable()
    val role = text("role").default("patient")
    val isActive = bool("is_active").default(true)
<<<<<<< HEAD
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
=======
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

    override val primaryKey = PrimaryKey(id)
}