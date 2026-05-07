# API Contract — Dental AI ML Service

Tài liệu này dành cho **Backend Kotlin** tích hợp với ml-service.  
Mọi thay đổi breaking phải thông báo trước cho cả team.

---

## Kết nối

| Thuộc tính | Giá trị |
|---|---|
| Base URL (nội bộ) | `http://localhost:8000` hoặc `http://ml-service:8000` (Docker network) |
| Protocol | HTTP/1.1 (không cần HTTPS trong nội bộ) |
| Content-Type | `application/json` (tất cả request và response) |
| Không expose | Service này **không** public ra internet — Backend là proxy duy nhất |

---

## Timeout khuyến nghị

| Endpoint | Timeout |
|---|---|
| `GET /health` | 2s |
| `POST /classify` | 5s |
| `POST /chat` | 15s (Gemini + RAG có thể chậm) |
| `POST /embed` | 60s (xử lý PDF nặng) |

---

## Endpoints

### GET /health

Kiểm tra service còn sống và model đã load xong.

**Request:** không có body

**Response 200:**
```json
{
  "status": "ok",
  "service": "dental-ai",
  "model_backend": "svm",
  "pinecone_index": "dental-kb",
  "labels": ["sau_rang","viem_nuou","e_buot","rang_khon","chinh_nha","tham_my","mat_rang","khac"]
}
```

**Ví dụ curl:**
```bash
curl http://localhost:8000/health
```

---

### POST /classify

Phân loại câu hỏi của bệnh nhân thành 1 trong 8 nhóm bệnh nha khoa.

**Request body:**
```json
{
  "text": "Răng tôi bị đau nhức mấy ngày nay, ăn đồ ngọt thấy ê buốt"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `text` | string | ✓ | Câu hỏi / mô tả triệu chứng của bệnh nhân |

**Response 200:**
```json
{
  "label": "sau_rang",
  "confidence": 0.8731,
  "top_labels": [
    { "label": "sau_rang", "confidence": 0.8731 },
    { "label": "e_buot",   "confidence": 0.0923 },
    { "label": "khac",     "confidence": 0.0346 }
  ]
}
```

| Field | Type | Mô tả |
|---|---|---|
| `label` | string | Nhãn dự đoán chính |
| `confidence` | float | Xác suất nhãn chính (0.0 – 1.0) |
| `top_labels` | array | Top 3 nhãn có xác suất cao nhất |

**Ví dụ curl:**
```bash
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "Răng tôi bị đau nhức mấy ngày nay"}'
```

---

### POST /compare

Chạy **cả SVM lẫn PhoBERT** trên cùng một câu hỏi. Endpoint này phục vụ demo so sánh 2 mô hình cho hội đồng — **Backend production có thể không cần dùng**.

**Request body:**
```json
{
  "text": "Răng tôi bị ê buốt khi uống đồ lạnh"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `text` | string | ✓ | Câu hỏi cần phân loại |

**Response 200:**
```json
{
  "text": "Răng tôi bị ê buốt khi uống đồ lạnh",
  "svm": {
    "label": "e_buot",
    "confidence": 0.9559,
    "top_labels": [
      { "label": "e_buot",    "confidence": 0.9559 },
      { "label": "chinh_nha", "confidence": 0.0116 },
      { "label": "mat_rang",  "confidence": 0.0096 }
    ]
  },
  "phobert": {
    "label": "e_buot",
    "confidence": 0.3055,
    "top_labels": [
      { "label": "e_buot",   "confidence": 0.3055 },
      { "label": "khac",     "confidence": 0.1881 },
      { "label": "sau_rang", "confidence": 0.1184 }
    ]
  },
  "agreement": true
}
```

| Field | Type | Mô tả |
|---|---|---|
| `text` | string | Echo lại text request |
| `svm` | object | Kết quả từ SVM (cùng schema `/classify`) |
| `phobert` | object | Kết quả từ PhoBERT (cùng schema `/classify`) |
| `agreement` | boolean | `true` nếu cả 2 model dự đoán cùng nhãn |

> **Ghi chú cho slide hội đồng:** Trên 1086 câu, SVM macro F1 = 0.938 vs PhoBERT 0.681.

---

### POST /chat

Luồng đầy đủ: phân loại → RAG retrieval → Gemini → câu trả lời cho bệnh nhân.

**Request body:**
```json
{
  "text": "Răng tôi bị ê buốt khi uống nước lạnh, phải làm gì?",
  "use_rag": true
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `text` | string | ✓ | Câu hỏi của bệnh nhân |
| `use_rag` | boolean | ✗ (default: `true`) | `false` = bỏ qua ML+RAG, hỏi thẳng Gemini |

**Response 200:**
```json
{
  "answer": "Ê buốt khi uống nước lạnh thường do lớp men răng bị mòn hoặc ngà răng bị lộ...",
  "disclaimer": "⚠️ Kết quả chỉ mang tính tham khảo. Vui lòng gặp bác sĩ để được chẩn đoán và điều trị chính xác.",
  "ml_result": {
    "label": "e_buot",
    "confidence": 0.9124,
    "top_labels": [
      { "label": "e_buot",   "confidence": 0.9124 },
      { "label": "sau_rang", "confidence": 0.0612 },
      { "label": "khac",     "confidence": 0.0264 }
    ]
  },
  "context_count": 3,
  "use_rag": true
}
```

| Field | Type | Mô tả |
|---|---|---|
| `answer` | string | Câu trả lời tiếng Việt từ Gemini |
| `disclaimer` | string | Cảnh báo cố định, Backend **phải** hiển thị cùng `answer` |
| `ml_result` | object | Kết quả phân loại (cùng schema với `/classify`) |
| `context_count` | int | Số đoạn tài liệu RAG tìm được (0 nếu `use_rag=false`) |
| `use_rag` | boolean | Echo lại giá trị request |

**Ví dụ curl:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Răng tôi bị ê buốt khi uống nước lạnh", "use_rag": true}'
```

---

### POST /embed

Admin upload PDF tài liệu nha khoa → ml-service tự xử lý và nạp vào Pinecone.  
Backend nhận file từ admin, encode base64, gọi endpoint này.

**Request body:**
```json
{
  "filename": "phac_do_dieu_tri_2024.pdf",
  "file_bytes_base64": "<chuỗi base64 của file PDF>"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `filename` | string | ✓ | Tên file gốc (dùng làm metadata `source`) |
| `file_bytes_base64` | string | ✓ | Nội dung file PDF encode base64 |

**Response 200:**
```json
{
  "status": "ok",
  "chunks_upserted": 42,
  "namespace": "phac_do_dieu_tri_2024"
}
```

**Ví dụ Kotlin (OkHttp):**
```kotlin
val pdfBytes = File("phac_do_dieu_tri_2024.pdf").readBytes()
val body = """
  {
    "filename": "phac_do_dieu_tri_2024.pdf",
    "file_bytes_base64": "${Base64.getEncoder().encodeToString(pdfBytes)}"
  }
""".trimIndent()
val request = Request.Builder()
    .url("http://ml-service:8000/embed")
    .post(body.toRequestBody("application/json".toMediaType()))
    .build()
```

---

## Mã lỗi

| HTTP Status | Điều kiện | Response body |
|---|---|---|
| `400 Bad Request` | `text` rỗng hoặc chỉ có khoảng trắng | `{"detail": "text không được để trống"}` |
| `500 Internal Server Error` | Lỗi nội bộ (Gemini timeout, lỗi xử lý PDF, ...) | `{"detail": "<mô tả lỗi>"}` |
| `503 Service Unavailable` | Model chưa load xong khi startup | Service chưa nhận request (health check trả non-200) |

**Khuyến nghị Backend:** poll `GET /health` mỗi 2s sau khi khởi động container, chỉ route traffic khi `status == "ok"`.

---

## Bảng label → tên hiển thị tiếng Việt

| `label` (ml_result) | Tên hiển thị | Ghi chú |
|---|---|---|
| `sau_rang` | Sâu răng | |
| `viem_nuou` | Viêm nướu / Nha chu | |
| `e_buot` | Ê buốt / Nhạy cảm ngà | |
| `rang_khon` | Răng khôn | |
| `chinh_nha` | Chỉnh nha / Niềng răng | |
| `tham_my` | Nha thẩm mỹ | |
| `mat_rang` | Mất răng / Phục hình | |
| `khac` | Tổng quát | Câu hỏi không thuộc 7 nhóm trên |

> Label index trong `label_map.json` (dùng bởi PhoBERT): `0=chinh_nha, 1=e_buot, 2=khac, 3=mat_rang, 4=rang_khon, 5=sau_rang, 6=tham_my, 7=viem_nuou`