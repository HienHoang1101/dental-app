package com.nhom2.chat

import com.nhom2.Security
import com.nhom2.models.Services
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
    private val mlServiceUrl = env["ML_SERVICE_URL"] ?: System.getenv("ML_SERVICE_URL") ?: "http://localhost:8000"
    
    private val httpClient = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }
    
    // ── Label to Services Mapping (Synced with ML-Service v2.0) ───────────────────────────
    private val labelToServiceKeywords = mapOf(
        "sau_rang" to listOf("Hàn răng", "Trám răng", "Sâu răng"),
        "viem_tuy" to listOf("Điều trị tủy", "Nội nha"),
        "viem_nuou" to listOf("Lấy cao răng", "Vệ sinh răng", "Nha chu"),
        "viem_nha_chu" to listOf("Điều trị nha chu", "Cạo vôi răng"),
        "rang_khon_moc_lech" to listOf("Nhổ răng khôn", "Tiểu phẫu"),
        "nhay_cam_nga" to listOf("Trám răng", "Chống ê buốt"),
        "gay_vo_rang" to listOf("Phục hình", "Răng sứ", "Trám răng"),
        "nhiem_trung_rang" to listOf("Điều trị tủy", "Nhổ răng", "Áp xe"),
        "tham_my" to listOf("Tẩy trắng", "Dán sứ", "Veneer", "Bọc răng sứ"),
        "chinh_nha" to listOf("Niềng răng", "Invisalign"),
        "mat_rang" to listOf("Implant", "Cấy ghép", "Cầu răng", "Hàm giả")
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
                primaryConfidence = null,
                isDeleted = false
            )
        }
    }
    
    /**
     * Lấy danh sách sessions của patient
     */
    fun getSessionsByPatient(patientId: UUID): List<ChatSessionResponse> {
        return transaction {
            ChatSessions.select { (ChatSessions.patientId eq patientId) and (ChatSessions.isDeleted eq false) }
                .orderBy(ChatSessions.startedAt, SortOrder.DESC)
                .map { row ->
                    ChatSessionResponse(
                        id = row[ChatSessions.id].toString(),
                        patientId = row[ChatSessions.patientId].toString(),
                        startedAt = row[ChatSessions.startedAt].toString(),
                        endedAt = row[ChatSessions.endedAt]?.toString(),
                        summary = row[ChatSessions.summary],
                        primaryLabel = row[ChatSessions.primaryLabel],
                        primaryConfidence = row[ChatSessions.primaryConfidence],
                        isDeleted = row[ChatSessions.isDeleted]
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
                primaryConfidence = sessionRow[ChatSessions.primaryConfidence],
                isDeleted = sessionRow[ChatSessions.isDeleted]
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
                setBody(MLChatRequest(text = content, use_rag = true, session_id = sessionId.toString()))
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
        
        // 5. Tạo service suggestions (nếu confidence > 0.4 - ngưỡng thấp hơn cho gợi ý)
        val suggestions = if (mlResponse.ml_result.confidence > 0.4) {
            getServiceSuggestions(mlResponse.ml_result.label, mlResponse.ml_result.confidence)
        } else null
        
        return SendMessageResponse(
            userMessage = userMessage,
            assistantMessage = assistantMessage,
            suggestions = suggestions
        )
    }
    
    /**
     * Lấy service suggestions dựa trên ML label bằng cách truy vấn database
     */
    private fun getServiceSuggestions(label: String, confidence: Double): List<ServiceSuggestion> {
        val keywords = labelToServiceKeywords[label] ?: return emptyList()
        
        return transaction {
            // Tìm kiếm các dịch vụ có tên chứa keywords
            val matchedServices = Services.select { 
                Services.isActive eq true 
            }.filter { row ->
                val name = row[Services.name].lowercase()
                keywords.any { kw -> name.contains(kw.lowercase()) }
            }.take(3) // Tối đa 3 gợi ý
            
            matchedServices.mapIndexed { index, row ->
                ServiceSuggestion(
                    serviceId = row[Services.id].toString(),
                    serviceName = row[Services.name],
                    specialtyId = row[Services.specialtyId]?.toString(),
                    confidence = if (index == 0) confidence else confidence * 0.8,
                    estimatedPrice = String.format("%,dđ", row[Services.price])
                )
            }
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
            // Soft delete: Chỉ set is_deleted = true
            // Không xóa messages để bác sĩ vẫn có thể xem lại trong appointment context
            ChatSessions.update({ ChatSessions.id eq sessionId }) {
                it[ChatSessions.isDeleted] = true
            } > 0
        }
    }
    
    /**
     * Lấy chat history của bệnh nhân theo appointment ID (cho bác sĩ)
     */
    fun getPatientChatHistoryByAppointment(appointmentId: UUID, doctorId: UUID): PatientChatHistoryResponse? {
        return transaction {
            // Join appointments với users và chat_sessions
            val query = com.nhom2.models.Appointments
                .join(com.nhom2.auth.UserTable, JoinType.INNER) { com.nhom2.models.Appointments.patientId eq com.nhom2.auth.UserTable.id }
                .join(ChatSessions, JoinType.LEFT) { com.nhom2.models.Appointments.chatSessionId eq ChatSessions.id }
                .select { 
                    (com.nhom2.models.Appointments.id eq appointmentId) and 
                    (com.nhom2.models.Appointments.doctorId eq doctorId)
                }
                .singleOrNull() ?: return@transaction null
            
            val patientId = query[com.nhom2.models.Appointments.patientId].toString()
            val patientName = query[com.nhom2.auth.UserTable.fullName] ?: "Unknown"
            val appointmentDate = query[com.nhom2.models.Appointments.appointmentDate].toString()
            val appointmentStatus = query[com.nhom2.models.Appointments.status]
            val chatSessionId = query[ChatSessions.id]
            
            // Lấy chat history nếu có
            val chatHistory = chatSessionId?.let { sessionId ->
                getSessionWithMessages(sessionId)
            }
            
            PatientChatHistoryResponse(
                patientId = patientId,
                patientName = patientName,
                appointmentId = appointmentId.toString(),
                appointmentDate = appointmentDate,
                appointmentStatus = appointmentStatus,
                chatHistory = chatHistory
            )
        }
    }
    
    /**
     * Lấy danh sách tất cả bệnh nhân có chat history của một bác sĩ
     */
    fun getPatientChatHistoriesByDoctor(doctorId: UUID): List<PatientChatHistoryResponse> {
        return transaction {
            val query = com.nhom2.models.Appointments
                .join(com.nhom2.auth.UserTable, JoinType.INNER) { com.nhom2.models.Appointments.patientId eq com.nhom2.auth.UserTable.id }
                .join(ChatSessions, JoinType.LEFT) { com.nhom2.models.Appointments.chatSessionId eq ChatSessions.id }
                .select { 
                    (com.nhom2.models.Appointments.doctorId eq doctorId) and
                    (com.nhom2.models.Appointments.status inList listOf("confirmed", "completed")) and
                    (com.nhom2.models.Appointments.chatSessionId.isNotNull())
                }
                .orderBy(com.nhom2.models.Appointments.appointmentDate, SortOrder.DESC)
            
            query.map { row ->
                val patientId = row[com.nhom2.models.Appointments.patientId].toString()
                val patientName = row[com.nhom2.auth.UserTable.fullName] ?: "Unknown"
                val appointmentId = row[com.nhom2.models.Appointments.id].toString()
                val appointmentDate = row[com.nhom2.models.Appointments.appointmentDate].toString()
                val appointmentStatus = row[com.nhom2.models.Appointments.status]
                val chatSessionId = row[ChatSessions.id]
                
                // Lấy chat history summary (không lấy full messages để tối ưu performance)
                val chatHistory = chatSessionId?.let { sessionId ->
                    val sessionRow = ChatSessions.select { ChatSessions.id eq sessionId }.singleOrNull()
                    sessionRow?.let {
                        val session = ChatSessionResponse(
                            id = it[ChatSessions.id].toString(),
                            patientId = it[ChatSessions.patientId].toString(),
                            startedAt = it[ChatSessions.startedAt].toString(),
                            endedAt = it[ChatSessions.endedAt]?.toString(),
                            summary = it[ChatSessions.summary],
                            primaryLabel = it[ChatSessions.primaryLabel],
                            primaryConfidence = it[ChatSessions.primaryConfidence],
                            isDeleted = it[ChatSessions.isDeleted]
                        )
                        ChatHistoryResponse(session, emptyList()) // Không load messages trong list view
                    }
                }
                
                PatientChatHistoryResponse(
                    patientId = patientId,
                    patientName = patientName,
                    appointmentId = appointmentId,
                    appointmentDate = appointmentDate,
                    appointmentStatus = appointmentStatus,
                    chatHistory = chatHistory
                )
            }
        }
    }
}
