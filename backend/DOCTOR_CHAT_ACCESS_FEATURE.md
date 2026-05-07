# Tính năng: Bác sĩ xem lịch sử chat của bệnh nhân

## Mô tả

Tính năng này cho phép bác sĩ xem lịch sử chat của bệnh nhân khi có cuộc hẹn đã được xác nhận. Bác sĩ có thể đọc được triệu chứng và thông tin mà bệnh nhân đã trao đổi với chatbot AI trước khi đặt lịch hẹn.

## Cách hoạt động

### 1. Liên kết Chat với Appointment

- Khi bệnh nhân đặt lịch hẹn, có thể truyền `chatSessionId` trong request
- Appointment sẽ được liên kết với chat session thông qua cột `chat_session_id`
- Chỉ bác sĩ có cuộc hẹn được xác nhận mới có thể xem chat history

### 2. Phân quyền truy cập

- **Bệnh nhân**: Chỉ xem được chat history của chính mình
- **Bác sĩ**: Chỉ xem được chat history của bệnh nhân có cuộc hẹn confirmed/completed
- Sử dụng Row Level Security (RLS) policies trong database để đảm bảo bảo mật

### 3. API Endpoints mới

#### GET /api/chat/doctor/patients

Lấy danh sách tất cả bệnh nhân có chat history của bác sĩ hiện tại.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "patientId": "uuid",
      "patientName": "Tên bệnh nhân",
      "appointmentId": "uuid",
      "appointmentDate": "2026-05-08",
      "appointmentStatus": "confirmed",
      "chatHistory": {
        "session": {
          "id": "uuid",
          "patientId": "uuid",
          "startedAt": "2026-05-08T10:00:00Z",
          "endedAt": "2026-05-08T10:30:00Z",
          "summary": "Bệnh nhân than phiền về đau răng...",
          "primaryLabel": "sau_rang",
          "primaryConfidence": 0.85
        },
        "messages": [] // Empty trong list view để tối ưu performance
      }
    }
  ]
}
```

#### GET /api/chat/doctor/appointments/{appointmentId}/chat

Lấy chi tiết chat history của bệnh nhân theo appointment ID.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "patientId": "uuid",
    "patientName": "Tên bệnh nhân",
    "appointmentId": "uuid",
    "appointmentDate": "2026-05-08",
    "appointmentStatus": "confirmed",
    "chatHistory": {
      "session": {
        "id": "uuid",
        "patientId": "uuid",
        "startedAt": "2026-05-08T10:00:00Z",
        "endedAt": "2026-05-08T10:30:00Z",
        "summary": "Bệnh nhân than phiền về đau răng hàm dưới bên trái...",
        "primaryLabel": "sau_rang",
        "primaryConfidence": 0.85
      },
      "messages": [
        {
          "id": "uuid",
          "sessionId": "uuid",
          "role": "user",
          "content": "Tôi bị đau răng hàm dưới bên trái",
          "mlLabel": "sau_rang",
          "mlConfidence": 0.9,
          "createdAt": "2026-05-08T10:00:00Z"
        },
        {
          "id": "uuid",
          "sessionId": "uuid",
          "role": "assistant",
          "content": "Tôi hiểu bạn đang gặp vấn đề về đau răng...",
          "mlLabel": null,
          "mlConfidence": null,
          "createdAt": "2026-05-08T10:01:00Z"
        }
      ]
    }
  }
}
```

#### GET /api/chat/doctor/sessions/{sessionId}

Lấy chi tiết session với full messages (cho bác sĩ có quyền truy cập).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "patientId": "uuid",
      "startedAt": "2026-05-08T10:00:00Z",
      "endedAt": "2026-05-08T10:30:00Z",
      "summary": "Bệnh nhân than phiền về đau răng...",
      "primaryLabel": "sau_rang",
      "primaryConfidence": 0.85
    },
    "messages": [...]
  }
}
```

## Cách sử dụng

### 1. Từ phía Frontend (Bệnh nhân)

Khi đặt lịch hẹn, truyền `chatSessionId` trong request:

```javascript
const appointmentRequest = {
  doctorId: "doctor-uuid",
  startTime: "2026-05-08T14:00:00Z",
  endTime: "2026-05-08T15:00:00Z",
  serviceId: "service-uuid",
  notes: "Đau răng hàm dưới",
  chatSessionId: "chat-session-uuid", // Liên kết với chat history
};

fetch("/api/appointments/v2", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(appointmentRequest),
});
```

### 2. Từ phía Frontend (Bác sĩ)

Xem danh sách bệnh nhân có chat history:

```javascript
// Lấy danh sách bệnh nhân
const response = await fetch("/api/chat/doctor/patients", {
  headers: {
    Authorization: `Bearer ${doctorToken}`,
  },
});
const patients = await response.json();

// Xem chi tiết chat của một appointment
const chatResponse = await fetch(
  `/api/chat/doctor/appointments/${appointmentId}/chat`,
  {
    headers: {
      Authorization: `Bearer ${doctorToken}`,
    },
  },
);
const patientChat = await chatResponse.json();
```

## Bảo mật

### 1. Authentication & Authorization

- Chỉ user có role "doctor" mới có thể truy cập các endpoint `/api/chat/doctor/*`
- Kiểm tra doctor profile tồn tại thông qua `Security.getDoctorIdByUserId()`

### 2. Access Control

- Bác sĩ chỉ có thể xem chat của bệnh nhân có cuộc hẹn confirmed/completed
- Không thể xem chat của bệnh nhân khác hoặc appointment pending/cancelled

### 3. Database Security

- Row Level Security (RLS) policies đảm bảo data isolation
- Foreign key constraints đảm bảo data integrity

## Lợi ích

### 1. Cho Bác sĩ

- Hiểu rõ triệu chứng và tình trạng bệnh nhân trước khi khám
- Có thông tin chuẩn bị sẵn để tư vấn hiệu quả hơn
- Tiết kiệm thời gian hỏi han trong buổi khám

### 2. Cho Bệnh nhân

- Không cần lặp lại thông tin đã cung cấp cho chatbot
- Bác sĩ đã có context về tình trạng sức khỏe
- Trải nghiệm khám bệnh mượt mà hơn

### 3. Cho Hệ thống

- Tận dụng dữ liệu chat đã thu thập
- Cải thiện chất lượng dịch vụ y tế
- Tích hợp AI vào quy trình khám bệnh

## Cấu trúc Database

### Bảng chat_sessions

```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES users(id),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    summary TEXT,
    primary_label TEXT,
    primary_confidence DOUBLE PRECISION
);
```

### Bảng chat_messages

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id),
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT,
    ml_label TEXT,
    ml_confidence DOUBLE PRECISION,
    created_at TIMESTAMPTZ
);
```

### Cập nhật bảng appointments

```sql
ALTER TABLE appointments
ADD COLUMN chat_session_id UUID REFERENCES chat_sessions(id);
```

## Files đã thay đổi

1. **backend/src/main/kotlin/com/nhom2/chat/ChatDTOs.kt**
   - Thêm `PatientChatHistoryResponse` DTO

2. **backend/src/main/kotlin/com/nhom2/chat/ChatService.kt**
   - Thêm `getPatientChatHistoryByAppointment()`
   - Thêm `getPatientChatHistoriesByDoctor()`

3. **backend/src/main/kotlin/com/nhom2/chat/ChatRoutes.kt**
   - Thêm route `/api/chat/doctor/patients`
   - Thêm route `/api/chat/doctor/appointments/{appointmentId}/chat`
   - Thêm route `/api/chat/doctor/sessions/{sessionId}`

4. **backend/src/main/kotlin/com/nhom2/common/DTOs.kt**
   - Thêm `chatSessionId` vào `CreateAppointmentRequestV2`

5. **backend/src/main/kotlin/com/nhom2/appointment/AppointmentService.kt**
   - Cập nhật `createAppointmentV2()` để lưu `chatSessionId`

6. **backend/src/main/kotlin/com/nhom2/models/Tables.kt**
   - Thêm cột `chatSessionId` vào bảng `Appointments`

7. **backend/migrations/add_chat_tables.sql**
   - Migration đã có sẵn để thêm cột `chat_session_id`

## Testing

Để test tính năng này:

1. Tạo chat session với bệnh nhân
2. Đặt lịch hẹn với `chatSessionId`
3. Bác sĩ confirm appointment
4. Bác sĩ truy cập các endpoint để xem chat history

## Kết luận

Tính năng này đã được triển khai thành công và sẵn sàng sử dụng. Bác sĩ giờ đây có thể xem lịch sử chat của bệnh nhân có cuộc hẹn được xác nhận, giúp cải thiện chất lượng dịch vụ khám bệnh.
