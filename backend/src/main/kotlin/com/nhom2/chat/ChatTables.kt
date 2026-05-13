package com.nhom2.chat

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

/**
 * Supabase chat tables
 * Matches the schema: chat_sessions and chat_messages
 */

object ChatSessions : Table("chat_sessions") {
    val id                 = uuid("id").autoGenerate()
    val patientId          = uuid("patient_id")  // FK to users.id (handled by Supabase)
    val startedAt          = timestamp("started_at").clientDefault { Instant.now() }
    val endedAt            = timestamp("ended_at").nullable()
    val summary            = text("summary").nullable()
    val primaryLabel       = text("primary_label").nullable()
    val primaryConfidence  = double("primary_confidence").nullable()

    override val primaryKey = PrimaryKey(id)
}

object ChatMessages : Table("chat_messages") {
    val id            = uuid("id").autoGenerate()
    val sessionId     = uuid("session_id")  // FK to chat_sessions.id (handled by Supabase)
    val role          = text("role")  // "user" | "assistant"
    val content       = text("content")
    val mlLabel       = text("ml_label").nullable()
    val mlConfidence  = double("ml_confidence").nullable()
    val createdAt     = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}
