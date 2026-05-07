package com.nhom2.chat

import kotlinx.serialization.Serializable
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.time.Instant
import java.util.UUID

/**
 * DTOs for Chat feature
 */

// ── Request DTOs ────────────────────────────────────────────

@Serializable
data class CreateChatSessionRequest(
    val patientId: String  // UUID as String
)

@Serializable
data class SendMessageRequest(
    val content: String
)

// ── Response DTOs ───────────────────────────────────────────

@Serializable
data class ChatSessionResponse(
    val id: String,
    val patientId: String,
    val startedAt: String,  // ISO 8601 timestamp
    val endedAt: String?,
    val summary: String?,
    val primaryLabel: String?,
    val primaryConfidence: Double?
)

@Serializable
data class ChatMessageResponse(
    val id: String,
    val sessionId: String,
    val role: String,  // "user" | "assistant"
    val content: String,
    val mlLabel: String?,
    val mlConfidence: Double?,
    val createdAt: String  // ISO 8601 timestamp
)

@Serializable
data class SendMessageResponse(
    val userMessage: ChatMessageResponse,
    val assistantMessage: ChatMessageResponse,
    val suggestions: List<ServiceSuggestion>?
)

@Serializable
data class ServiceSuggestion(
    val serviceId: String,
    val serviceName: String,
    val confidence: Double,
    val estimatedPrice: String?
)

@Serializable
data class ChatHistoryResponse(
    val session: ChatSessionResponse,
    val messages: List<ChatMessageResponse>
)

// ── ML Service DTOs (for calling Python ML Service) ────────

@Serializable
data class MLChatRequest(
    val text: String,
    @Serializable(with = BooleanSerializer::class)
    val use_rag: Boolean = true
)

@Serializable
data class MLChatResponse(
    val answer: String,
    val disclaimer: String,
    val ml_result: MLClassifyResult,
    val context_count: Int,
    val use_rag: Boolean
)

@Serializable
data class MLClassifyResult(
    val label: String,
    val confidence: Double,
    val top_labels: List<MLLabelScore>
)

@Serializable
data class MLLabelScore(
    val label: String,
    val confidence: Double
)

@Serializable
data class MLSummarizeRequest(
    val messages: List<String>,
    val ml_label: String
)

@Serializable
data class MLSummarizeResponse(
    val summary: String,
    val key_symptoms: List<String>,
    val primary_label: String,
    val message_count: Int
)

// ── Custom Serializers ──────────────────────────────────────

object BooleanSerializer : KSerializer<Boolean> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("Boolean", PrimitiveKind.BOOLEAN)
    override fun serialize(encoder: Encoder, value: Boolean) = encoder.encodeBoolean(value)
    override fun deserialize(decoder: Decoder): Boolean = decoder.decodeBoolean()
}
