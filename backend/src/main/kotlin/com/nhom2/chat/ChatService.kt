package com.nhom2.chat

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

object ChatService {
    
    private val env = io.github.cdimascio.dotenv.dotenv { ignoreIfMissing = true }
    private val mlServiceUrl = env["ML_SERVICE_URL"] ?: System.getenv("ML_SERVICE_URL") ?: "http://localhost:8001"
    
    private val httpClient = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }
    
    // ── Label to Services Mapping ───────────────────────────
    private val labelToServices = mapOf(
        "sau_rang" to listOf("Hàn răng", "Trám răng", "Điều trị tủy"),
        "viem_nuou" to listOf("Lấy cao răng", "Điều trị nha chu"),
        "e_buot" to listOf("Trám răng", "Bọc răng sứ", "Điều trị tủy"),
        "rang_khon" to listOf("Nhổ răng khôn", "Phẫu thuật răng khôn"),
        "chinh_nha" to listOf("Niềng răng mắc cài", "Niềng răng invisalign"),
        "tham_my" to listOf("Bọc răng sứ", "Tẩy trắng răng", "Dán veneer"),
        "mat_rang" to listOf("Cấy ghép implant", "Làm cầu răng", "Hàm giả tháo lắp"),
        "khac" to emptyList()
    )
    
    /**
     * Tạo chat session mới
     */
    fun createSession(patientId: UUID): ChatSessionResponse {
        return transaction {
            val sessionId = ChatSessions.insert {
                it[ChatSessions.patientId] = patientId
                it[startedAt] = Instant.now()
            } get ChatSessions.id
            
            ChatSessionResponse(
                id = sessionId.toString(),
                patientId = patientId.toString(),
                startedAt = Instant.now().toString(),
                endedAt = null,
                summary = null,
                primaryLabel = null,
                primaryConfidence = null
            )
        }
    }
    
    /**
     * Lấy danh sách sessions của patient
     */
    fun getSessionsByPatient(patientId: UUID): List<ChatSessionResponse> {
        return transaction {
            ChatSessions.select { ChatSessions.patientId eq patientId }
                .orderBy(ChatSessions.startedAt, SortOrder.DESC)
                .map { row ->
                    ChatSessionResponse(
                        id = row[ChatSessions.id].toString(),
                        patientId = row[ChatSessions.patientId].toString(),
                        startedAt = row[ChatSessions.startedAt].toString(),
                        endedAt = row[ChatSessions.endedAt]?.toString(),
                        summary = row[ChatSessions.summary],
                        primaryLabel = row[ChatSessions.primaryLabel],
                        primaryConfidence = row[ChatSessions.primaryConfidence]
                    )
                }
        }
    }
    
    /**
     * Lấy chi tiết session với messages
     */
    fun getSessionWithMessages(sessionId: UUID): ChatHistoryResponse? {
        return transaction {
            val sessionRow = ChatSessions.select { ChatSessions.id eq sessionId }
                .singleOrNull() ?: return@transaction null
            
            val session = ChatSessionResponse(
                id = sessionRow[ChatSessions.id].toString(),
                patientId = sessionRow[ChatSessions.patientId].toString(),
                startedAt = sessionRow[ChatSessions.startedAt].toString(),
                endedAt = sessionRow[ChatSessions.endedAt]?.toString(),
                summary = sessionRow[ChatSessions.summary],
                primaryLabel = sessionRow[ChatSessions.primaryLabel],
                primaryConfidence = sessionRow[ChatSessions.primaryConfidence]
            )
            
            val messages = ChatMessages.select { ChatMessages.sessionId eq sessionId }
                .orderBy(ChatMessages.createdAt, SortOrder.ASC)
                .map { row ->
                    ChatMessageResponse(
                        id = row[ChatMessages.id].toString(),
                        sessionId = row[ChatMessages.sessionId].toString(),
                        role = row[ChatMessages.role],
                        content = row[ChatMessages.content],
                        mlLabel = row[ChatMessages.mlLabel],
                        mlConfidence = row[ChatMessages.mlConfidence],
                        createdAt = row[ChatMessages.createdAt].toString()
                    )
                }
            
            ChatHistoryResponse(session, messages)
        }
    }
    
    /**
     * Gửi tin nhắn và nhận phản hồi từ ML Service
     */
    suspend fun sendMessage(sessionId: UUID, content: String): SendMessageResponse {
        // 1. Lưu user message
        val userMessage = transaction {
            val messageId = ChatMessages.insert {
                it[ChatMessages.sessionId] = sessionId
                it[role] = "user"
                it[ChatMessages.content] = content
            } get ChatMessages.id
            
            ChatMessageResponse(
                id = messageId.toString(),
                sessionId = sessionId.toString(),
                role = "user",
                content = content,
                mlLabel = null,
                mlConfidence = null,
                createdAt = Instant.now().toString()
            )
        }
        
        // 2. Gọi ML Service
        val mlResponse = try {
            httpClient.post("$mlServiceUrl/chat") {
                contentType(ContentType.Application.Json)
                setBody(MLChatRequest(text = content, use_rag = true))
            }.body<MLChatResponse>()
        } catch (e: Exception) {
            // Fallback nếu ML Service không available
            MLChatResponse(
                answer = "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.",
                disclaimer = "⚠️ Kết quả chỉ mang tính tham khảo.",
                ml_result = MLClassifyResult(
                    label = "khac",
                    confidence = 0.0,
                    top_labels = emptyList()
                ),
                context_count = 0,
                use_rag = false
            )
        }
        
        // 3. Lưu assistant message
        val assistantMessage = transaction {
            val messageId = ChatMessages.insert {
                it[ChatMessages.sessionId] = sessionId
                it[role] = "assistant"
                it[ChatMessages.content] = mlResponse.answer
                it[mlLabel] = mlResponse.ml_result.label
                it[mlConfidence] = mlResponse.ml_result.confidence
            } get ChatMessages.id
            
            ChatMessageResponse(
                id = messageId.toString(),
                sessionId = sessionId.toString(),
                role = "assistant",
                content = mlResponse.answer,
                mlLabel = mlResponse.ml_result.label,
                mlConfidence = mlResponse.ml_result.confidence,
                createdAt = Instant.now().toString()
            )
        }
        
        // 4. Update session với primary label (nếu confidence cao)
        if (mlResponse.ml_result.confidence > 0.6) {
            transaction {
                ChatSessions.update({ ChatSessions.id eq sessionId }) {
                    it[primaryLabel] = mlResponse.ml_result.label
                    it[primaryConfidence] = mlResponse.ml_result.confidence
                }
            }
        }
        
        // 5. Tạo service suggestions (nếu confidence > 0.6)
        val suggestions = if (mlResponse.ml_result.confidence > 0.6) {
            getServiceSuggestions(mlResponse.ml_result.label, mlResponse.ml_result.confidence)
        } else null
        
        return SendMessageResponse(
            userMessage = userMessage,
            assistantMessage = assistantMessage,
            suggestions = suggestions
        )
    }
    
    /**
     * Lấy service suggestions dựa trên ML label
     */
    private suspend fun getServiceSuggestions(label: String, confidence: Double): List<ServiceSuggestion> {
        val serviceNames = labelToServices[label] ?: return emptyList()
        
        // TODO: Query actual services from database
        // For now, return mock data
        return serviceNames.mapIndexed { index, name ->
            ServiceSuggestion(
                serviceId = UUID.randomUUID().toString(),
                serviceName = name,
                confidence = if (index == 0) confidence else confidence * 0.3,
                estimatedPrice = "500,000đ - 2,000,000đ"
            )
        }
    }
    
    /**
     * Tạo summary cho session (gọi khi đặt lịch)
     */
    suspend fun createSummary(sessionId: UUID): String? {
        // 1. Lấy tất cả user messages
        val userMessages = transaction {
            ChatMessages.select { 
                (ChatMessages.sessionId eq sessionId) and (ChatMessages.role eq "user")
            }
            .orderBy(ChatMessages.createdAt, SortOrder.ASC)
            .map { it[ChatMessages.content] }
        }
        
        if (userMessages.isEmpty()) return null
        
        // 2. Lấy primary label
        val primaryLabel = transaction {
            ChatSessions.select { ChatSessions.id eq sessionId }
                .singleOrNull()
                ?.get(ChatSessions.primaryLabel) ?: "khac"
        }
        
        // 3. Gọi ML Service /summarize
        val summaryResponse = try {
            httpClient.post("$mlServiceUrl/summarize") {
                contentType(ContentType.Application.Json)
                setBody(MLSummarizeRequest(
                    messages = userMessages,
                    ml_label = primaryLabel
                ))
            }.body<MLSummarizeResponse>()
        } catch (e: Exception) {
            // Fallback
            return "Bệnh nhân đã trao đổi ${userMessages.size} tin nhắn về triệu chứng."
        }
        
        // 4. Update session với summary
        transaction {
            ChatSessions.update({ ChatSessions.id eq sessionId }) {
                it[summary] = summaryResponse.summary
                it[endedAt] = Instant.now()
            }
        }
        
        return summaryResponse.summary
    }
    
    /**
     * Xóa session
     */
    fun deleteSession(sessionId: UUID): Boolean {
        return transaction {
            // Xóa messages trước
            ChatMessages.deleteWhere { ChatMessages.sessionId eq sessionId }
            // Xóa session
            ChatSessions.deleteWhere { ChatSessions.id eq sessionId } > 0
        }
    }
}
