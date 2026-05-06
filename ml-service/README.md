# Dental ML Service

FastAPI service: SVM classify + PhoBERT classify + RAG retrieval (Pinecone) + Gemini generation.

> Tài liệu tích hợp cho Backend Kotlin: xem `docs/API_CONTRACT.md`.

---

## Yêu cầu

| Thành phần | Phiên bản |
|---|---|
| Python | **3.12** (khuyến nghị) hoặc **3.11** |
| RAM | Tối thiểu 2 GB (SVM only) — 6 GB nếu dùng PhoBERT |
| OS | Windows 10+, Ubuntu 20.04+, macOS 12+ |

---

## 1. Cài dependencies

```bash
cd ml-service/
python -m venv .venv

# Windows
.\.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

> `underthesea` cài thêm một số C-extension — nếu báo lỗi build trên Windows, cài thêm [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

---

## 2. Tạo file .env

Copy từ `.env.example` và điền giá trị thật:

```env
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=dental-kb
PINECONE_REGION=us-east-1
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_BACKEND=svm
MODELS_DIR=./models
MOCK_GEMINI=0
```

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `PINECONE_API_KEY` | ✓ | Lấy tại console.pinecone.io |
| `PINECONE_INDEX` | ✓ | Tên index đã tạo, mặc định `dental-kb` |
| `GEMINI_API_KEY` | ✓ | Lấy tại aistudio.google.com |
| `MODEL_BACKEND` | ✗ | `svm` (mặc định) hoặc `phobert` |
| `MODELS_DIR` | ✗ | Đường dẫn folder models, mặc định `./models` |
| `PINECONE_REGION` | ✗ | Region của Pinecone, mặc định `us-east-1` |
| `MOCK_GEMINI` | ✗ | `1` để mock Gemini khi offline |

---

## 3. Download model files

Liên hệ thành viên ML (Hiên) để lấy link Google Drive / shared folder. Tải về và đặt vào đúng đường dẫn:

```
ml-service/
└── models/
    ├── svm_pipeline.joblib      ← SVM + CalibratedClassifierCV (bắt buộc)
    ├── label_map.json           ← map index → tên nhãn (bắt buộc)
    └── phobert_best/            ← chỉ cần nếu MODEL_BACKEND=phobert
        ├── config.json
        ├── model.safetensors
        ├── tokenizer_config.json
        └── ...
```

Kiểm tra nhanh sau khi tải:

```bash
ls models/
# phải thấy: svm_pipeline.joblib  label_map.json
```

---

## 4. Chạy service

```bash
uvicorn main:app --reload --port 8000
```

Khi thấy các dòng sau là service đã sẵn sàng:

```
✅ SVM pipeline loaded
✅ Embedding model loaded
✅ Pinecone connected: dental-kb
✅ Gemini configured
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## 5. Test nhanh

**Health check:**
```bash
curl http://localhost:8000/health
```

**Classify một câu:**
```bash
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "Răng tôi bị đau nhức, ăn đồ ngọt thấy ê buốt"}'
```

Response mẫu:
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

**Chat đầy đủ (ML + RAG + Gemini):**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Răng khôn mọc lệch có cần nhổ không?", "use_rag": true}'
```

---

## Troubleshooting

### PhoBERT không load — lỗi OOM hoặc treo máy

**Nguyên nhân:** PhoBERT cần ~4–5 GB RAM, máy RAM thấp sẽ bị OOM hoặc swap rất chậm.

**Giải pháp:** Dùng SVM thay thế — không cần đụng code, chỉ đổi `.env`:
```env
MODEL_BACKEND=svm
```
SVM nhẹ hơn nhiều (~50 MB), đủ dùng cho demo và tích hợp Backend.

---

### Pinecone connection error khi startup

**Triệu chứng:** Service crash ngay lúc khởi động với lỗi `pinecone.exceptions.PineconeApiException` hoặc timeout.

**Kiểm tra lần lượt:**

1. API key đúng chưa — copy lại từ console.pinecone.io, tránh thừa khoảng trắng
2. Tên index khớp chưa — `PINECONE_INDEX` phải trùng chính xác với tên index trên Pinecone console
3. Index đã được tạo chưa — vào console.pinecone.io kiểm tra index `dental-kb` còn active không
4. Mạng có bị chặn không — thử `curl https://api.pinecone.io` xem có kết nối được không

---


### Port 8000 đã bị chiếm

```bash
uvicorn main:app --reload --port 8001
```
Báo cho Backend biết đổi Base URL thành `http://localhost:8001`.