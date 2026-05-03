package com.nhom2.doctor

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object DoctorTable : Table("doctors") {
    val id = uuid("id").autoGenerate()
    val userId = uuid("user_id").nullable()
    val fullName = text("full_name")
    val specialty = text("specialty")
    val degree = text("degree").nullable()
    val bio = text("bio").nullable()
    val avatarUrl = text("avatar_url").nullable()
    val isActive = bool("is_active").default(true)
    val createdAt = datetime("created_at").default(LocalDateTime.now())

    override val primaryKey = PrimaryKey(id)
}
