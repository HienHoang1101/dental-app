# Dental Backend — Setup Guide

## Yêu cầu
- Java 17+
- IntelliJ IDEA

## Chạy local
1. Clone repo này về máy
2. Copy `.env.example` thành `.env`
3. Hỏi lead để lấy các key điền vào `.env`
4. Mở IntelliJ -> Run `Application.kt`
5. Truy cập http://localhost:8080/health
   -> Thấy "Dental Backend is running" là OK

## Cấu trúc project
```text
src/main/kotlin/com/nhom2/
├── config/     ← Database, JWT config
├── auth/       ← Login, register
├── patient/    ← Hồ sơ bệnh nhân
├── booking/    ← Đặt lịch, bác sĩ, dịch vụ
├── chat/       ← Chatbot AI
├── admin/      ← Dashboard admin
└── plugins/    ← Routing, Serialization
```
