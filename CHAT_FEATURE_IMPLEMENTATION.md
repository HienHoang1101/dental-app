# 🎉 Chat Feature Implementation Complete!

## ✅ Đã hoàn thành

### 1. **ML Service (Python)** ✅

- **File**: `ml-service/main.py`
- **Endpoint mới**: `POST /summarize`
  - Input: `{messages: string[], ml_label: string}`
  - Output: `{summary, key_symptoms, primary_label, message_count}`
  - Dùng Gemini để tạo summary từ chat history

### 2. **Backend Kotlin** ✅

#### **DTOs** (`backend/src/main/kotlin/com/nhom2/chat/ChatDTOs.kt`)

- `CreateChatSessionRequest`
- `SendMessageRequest`
- `ChatSessionResponse`
- `ChatMessageResponse`
- `SendMessageResponse`
- `ServiceSuggestion`
- `ChatHistoryResponse`
- ML Service DTOs (MLChatRequest, MLChatResponse, MLSummarizeRequest, etc.)

#### **Tables** (`backend/src/main/kotlin/com/nhom2/chat/ChatTables.kt`)

- `ChatSessions` - Exposed table definition
- `ChatMessages` - Exposed table definition

#### **Service** (`backend/src/main/kotlin/com/nhom2/chat/ChatService.kt`)

- `createSession()` - Tạo chat session mới
- `getSessionsByPatient()` - Lấy danh sách sessions
- `getSessionWithMessages()` - Lấy chi tiết session + messages
- `sendMessage()` - Gửi tin nhắn + gọi ML Service + lưu response
- `getServiceSuggestions()` - Gợi ý dịch vụ dựa trên ML label
- `createSummary()` - Tạo summary (gọi khi đặt lịch)
- `deleteSession()` - Xóa session

#### **Routes** (`backend/src/main/kotlin/com/nhom2/chat/ChatRoutes.kt`)

- `POST /api/chat/sessions` - Tạo session mới
- `GET /api/chat/sessions` - List sessions của user
- `GET /api/chat/sessions/{id}` - Chi tiết session
- `POST /api/chat/sessions/{id}/messages` - Gửi tin nhắn
- `POST /api/chat/sessions/{id}/summary` - Tạo summary
- `DELETE /api/chat/sessions/{id}` - Xóa session

#### **Routing** (`backend/src/main/kotlin/com/nhom2/plugins/Routing.kt`)

- Đã register `chatRoutes()` vào `/api` prefix

### 3. **Database Migration** ✅

- **File**: `backend/migrations/add_chat_tables.sql`
- **Tạo tables**:
  - `chat_sessions` (id, patient_id, started_at, ended_at, summary, primary_label, primary_confidence)
  - `chat_messages` (id, session_id, role, content, ml_label, ml_confidence, created_at)
- **Update table**:
  - `appointments` thêm column `chat_session_id`
- **Row Level Security (RLS)**:
  - Patients chỉ xem được chat của mình
  - Doctors xem được chat của appointments được assign
- **Indexes** cho performance

---

## 🚀 Cách chạy

### **Bước 1: Chạy ML Service**

```bash
cd ml-service
.\.venv\Scripts\activate  # Windows
uvicorn main:app --reload --port 8000
```

Verify: http://localhost:8000/docs

### **Bước 2: Run Database Migration**

1. Vào Supabase Dashboard → SQL Editor
2. Copy nội dung file `backend/migrations/add_chat_tables.sql`
3. Paste và Run

Hoặc dùng CLI:

```bash
supabase db push --file backend/migrations/add_chat_tables.sql
```

### **Bước 3: Update Backend .env**

File `backend/.env` cần có:

```env
ML_SERVICE_URL=http://localhost:8000
```

### **Bước 4: Chạy Backend**

```bash
cd backend
./gradlew run
```

Verify: http://localhost:8080/health

---

## 📋 API Endpoints

### **Base URL**: `http://localhost:8080/api/chat`

### **1. Tạo Chat Session**

```http
POST /api/chat/sessions
Authorization: Bearer <jwt_token>

Response:
{
  "id": "uuid",
  "patientId": "uuid",
  "startedAt": "2026-05-07T10:00:00Z",
  "endedAt": null,
  "summary": null,
  "primaryLabel": null,
  "primaryConfidence": null
}
```

### **2. Gửi Tin Nhắn**

```http
POST /api/chat/sessions/{sessionId}/messages
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Răng tôi bị đau khi ăn đồ ngọt"
}

Response:
{
  "userMessage": {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "user",
    "content": "Răng tôi bị đau khi ăn đồ ngọt",
    "mlLabel": null,
    "mlConfidence": null,
    "createdAt": "2026-05-07T10:01:00Z"
  },
  "assistantMessage": {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "assistant",
    "content": "Dựa trên triệu chứng của bạn...",
    "mlLabel": "sau_rang",
    "mlConfidence": 0.87,
    "createdAt": "2026-05-07T10:01:05Z"
  },
  "suggestions": [
    {
      "serviceId": "uuid",
      "serviceName": "Hàn răng",
      "confidence": 0.87,
      "estimatedPrice": "500,000đ - 2,000,000đ"
    }
  ]
}
```

### **3. Lấy Chat History**

```http
GET /api/chat/sessions/{sessionId}
Authorization: Bearer <jwt_token>

Response:
{
  "session": { ... },
  "messages": [ ... ]
}
```

### **4. Tạo Summary (khi đặt lịch)**

```http
POST /api/chat/sessions/{sessionId}/summary
Authorization: Bearer <jwt_token>

Response:
{
  "summary": "Bệnh nhân có triệu chứng sâu răng. Đau khi ăn đồ ngọt..."
}
```

### **5. Xóa Session**

```http
DELETE /api/chat/sessions/{sessionId}
Authorization: Bearer <jwt_token>

Response:
{
  "message": "Session deleted successfully"
}
```

---

## 🔄 Luồng hoạt động

### **Patient Chat Flow**

```
1. User login → JWT token
2. POST /api/chat/sessions → sessionId
3. POST /api/chat/sessions/{id}/messages
   ↓
   Backend → ML Service /chat
   ↓
   ML Service: classify + RAG + Gemini
   ↓
   Backend: save messages + return suggestions
4. User xem suggestions → chọn service
5. User đặt lịch → POST /api/chat/sessions/{id}/summary
   ↓
   Backend → ML Service /summarize
   ↓
   Backend: update session.summary + link to appointment
```

### **Doctor View Flow**

```
1. Doctor login → JWT token
2. GET /api/doctor/appointments/{id}
   ↓
   Backend: check appointment.chat_session_id
   ↓
   If exists: GET /api/chat/sessions/{chat_session_id}
   ↓
   Return: appointment + chat_summary + messages
3. Doctor xem summary + full chat history
```

---

## 🎨 Frontend Integration (Next Steps)

### **Chat Widget Component** (cần tạo)

```typescript
// components/ChatWidget.tsx
import { useState } from 'react'

export function ChatWidget() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  const createSession = async () => {
    const res = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setSessionId(data.id)
  }

  const sendMessage = async (content: string) => {
    const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    })
    const data = await res.json()
    setMessages([...messages, data.userMessage, data.assistantMessage])
    // Show suggestions if available
    if (data.suggestions) {
      showSuggestions(data.suggestions)
    }
  }

  return (
    <div className="chat-widget">
      {/* Chat UI */}
    </div>
  )
}
```

---

## 🧪 Testing

### **Test ML Service**

```bash
# Test /chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Răng tôi đau", "use_rag": true}'

# Test /summarize endpoint
curl -X POST http://localhost:8000/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "messages": ["Răng tôi đau khi ăn đồ ngọt", "Có bị ê buốt nữa"],
    "ml_label": "sau_rang"
  }'
```

### **Test Backend API**

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "patient@test.com", "password": "password"}' \
  | jq -r '.data.token')

# 2. Create session
SESSION_ID=$(curl -X POST http://localhost:8080/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.id')

# 3. Send message
curl -X POST http://localhost:8080/api/chat/sessions/$SESSION_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Răng tôi đau khi ăn đồ ngọt"}'

# 4. Get history
curl http://localhost:8080/api/chat/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Database Schema

```sql
chat_sessions
├── id (uuid, PK)
├── patient_id (uuid, FK → users.id)
├── started_at (timestamptz)
├── ended_at (timestamptz, nullable)
├── summary (text, nullable)
├── primary_label (text, nullable)
└── primary_confidence (double, nullable)

chat_messages
├── id (uuid, PK)
├── session_id (uuid, FK → chat_sessions.id)
├── role (text: user | assistant)
├── content (text)
├── ml_label (text, nullable)
├── ml_confidence (double, nullable)
└── created_at (timestamptz)

appointments
└── chat_session_id (uuid, FK → chat_sessions.id, nullable)
```

---

## 🔐 Security

- ✅ JWT Authentication required
- ✅ Row Level Security (RLS) enabled
- ✅ Patients can only access their own chats
- ✅ Doctors can only access chats linked to their appointments
- ✅ All API endpoints protected with `authenticate("auth-jwt")`

---

## 📈 Next Steps

### **Phase 1: Frontend** (1-2 tuần)

- [ ] Tạo ChatWidget component
- [ ] Tích hợp với Backend API
- [ ] UI/UX cho service suggestions
- [ ] Link chat → booking flow

### **Phase 2: Doctor Dashboard** (1 tuần)

- [ ] Thêm chat history view trong appointment detail
- [ ] Hiển thị summary + ML classification
- [ ] Collapsible full chat history

### **Phase 3: Enhancements** (optional)

- [ ] Chat analytics dashboard
- [ ] Export chat to PDF
- [ ] Multi-turn conversation context
- [ ] Real-time typing indicators

---

## 🐛 Troubleshooting

### **ML Service không kết nối được**

```
Error: Connection refused to http://localhost:8000
```

**Fix**: Kiểm tra ML Service đang chạy:

```bash
curl http://localhost:8000/health
```

### **Database migration lỗi**

```
Error: relation "chat_sessions" already exists
```

**Fix**: Tables đã tồn tại, skip migration hoặc rollback trước:

```sql
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
```

### **JWT token invalid**

```
Error: 401 Unauthorized
```

**Fix**: Login lại để lấy token mới:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "password"}'
```

---

## 📚 Documentation

- **ML Service API**: http://localhost:8000/docs (FastAPI auto-generated)
- **Backend API**: Xem file này (CHAT_FEATURE_IMPLEMENTATION.md)
- **Database Schema**: `backend/migrations/add_chat_tables.sql`

---

## ✨ Features Implemented

✅ Chat với AI chatbot (ML + RAG + Gemini)  
✅ Service suggestions dựa trên ML classification  
✅ Chat history persistence  
✅ Summary generation cho bác sĩ  
✅ Link chat → appointment  
✅ Row Level Security  
✅ JWT Authentication  
✅ RESTful API endpoints  
✅ Database migrations  
✅ Error handling & fallbacks

---

**Tất cả đã sẵn sàng để chạy! 🚀**

Bạn có thể bắt đầu test ngay bây giờ hoặc tiếp tục phát triển Frontend.
