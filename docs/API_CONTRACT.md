# API Contract
## Ung dung Phong Kham Nha — AI Chatbot & Machine Learning

> Phien ban: 1.0 | Trang thai: Draft | Cap nhat: 2026

---

## 1. Tong quan

Tai lieu nay mo ta hop dong API giua cac thanh phan:
- Frontend (Next.js) <-> Backend (Kotlin/Ktor)
- Backend (Kotlin/Ktor) <-> ML Service (FastAPI)

> Luu y: ML Service la internal service, khong expose ra ngoai.

---

## 2. Backend API (Public)

Base URL:
```
https://api.nhakhoaapp.vn/v1
```

Auth:
- Header: `Authorization: Bearer <JWT_TOKEN>`
- Tat ca endpoint co dau (Auth) bat buoc JWT

### 2.1 Auth

**POST /auth/register**

Request:
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123",
  "full_name": "Nguyen Van A",
  "phone": "0901234567"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "role": "patient"
  }
}
```

**POST /auth/login**

Request:
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123"
}
```

Response: giong `POST /auth/register`.

### 2.2 Chatbot

**POST /chat/sessions** (Auth: Patient)

Response:
```json
{ "session_id": "uuid" }
```

**POST /chat/sessions/:id/messages** (Auth: Patient)

Request:
```json
{ "content": "Rang toi bi e buot khi uong do lanh" }
```

Response:
```json
{
  "message_id": "uuid",
  "role": "assistant",
  "content": "Trieu chung e buot khi tiep xuc nhiet do thap...",
  "ml_result": {
    "label": "e_buot",
    "confidence": 0.87
  },
  "disclaimer": "Ket qua chi mang tinh tham khao...",
  "created_at": "2026-03-26T10:30:00Z"
}
```

### 2.3 Booking

**GET /doctors** (Auth: optional)

Response:
```json
[
  { "id": "uuid", "full_name": "BS A", "specialty": "Nha tong quat" }
]
```

**GET /services**

Response:
```json
[
  { "id": "uuid", "name": "Nho rang khon", "price": 500000 }
]
```

**POST /appointments** (Auth: Patient)

Request:
```json
{
  "doctor_id": "uuid",
  "service_id": "uuid",
  "schedule_id": "uuid",
  "note": "Bi e buot rang ham duoi ben trai"
}
```

Response:
```json
{ "appointment_id": "uuid", "status": "pending" }
```

---

## 3. ML Service API (Internal)

Base URL (local):
```
http://localhost:8000
```

### 3.1 Health

**GET /health**

Response:
```json
{
  "status": "ok",
  "service": "dental-ai",
  "model_backend": "svm",
  "pinecone_index": "dental-kb",
  "labels": ["sau_rang", "viem_nuou", "e_buot", "rang_khon", "chinh_nha", "tham_my", "mat_rang", "khac"]
}
```

### 3.2 Classify

**POST /classify**

Request:
```json
{ "text": "Rang toi bi e buot khi uong do lanh" }
```

Response:
```json
{
  "label": "e_buot",
  "confidence": 0.87,
  "top_labels": [
    { "label": "e_buot", "confidence": 0.87 },
    { "label": "sau_rang", "confidence": 0.09 },
    { "label": "khac", "confidence": 0.04 }
  ]
}
```

### 3.3 Compare (Demo)

**POST /compare**

Request:
```json
{ "text": "Rang toi bi dau nhuc" }
```

Response:
```json
{
  "text": "Rang toi bi dau nhuc",
  "svm": { "label": "sau_rang", "confidence": 0.83, "top_labels": [] },
  "phobert": { "label": "sau_rang", "confidence": 0.79, "top_labels": [] },
  "agreement": true
}
```

### 3.4 Chat

**POST /chat**

Request:
```json
{ "text": "Rang khon moc lech co can nho khong?", "use_rag": true }
```

Response:
```json
{
  "answer": "Rang khon moc lech thuong...",
  "disclaimer": "Ket qua chi mang tinh tham khao...",
  "ml_result": {
    "label": "rang_khon",
    "confidence": 0.88,
    "top_labels": [
      { "label": "rang_khon", "confidence": 0.88 }
    ]
  },
  "context_count": 3,
  "use_rag": true
}
```

### 3.5 Embed PDF (Admin upload)

**POST /embed**

Request:
```json
{
  "filename": "PHAC-DO-DIEU-TRI-BV-RHM-2023.pdf",
  "file_bytes_base64": "<base64-pdf>"
}
```

Response (success):
```json
{
  "status": "completed",
  "namespace": "phac_do_dieu_tri_bv_rhm_2023",
  "chunk_count": 640,
  "source": "PHAC-DO-DIEU-TRI-BV-RHM-2023.pdf"
}
```

Response (failed):
```json
{
  "status": "failed",
  "reason": "Khong doc duoc text tu PDF"
}
```

---

## 4. Error format

Backend va ML service tra loi loi theo dang sau:
```json
{
  "detail": "Thong diep loi"
}
```

---

## 5. Lien ket tai lieu

- `docs/BRD.md`
- `docs/REQUIREMENTS_SPECIFICATION.md`
- `docs/SYSTEM_DESIGN.md`
- `docs/DATABASE_DESIGN.md`

