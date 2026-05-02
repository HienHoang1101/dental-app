"""
ml-service/main.py
Dental ML Service — FastAPI
Tích hợp: SVM classify + RAG retrieval + Gemini generation
"""

import os
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env so API keys are available at import time
load_dotenv()

# ── Cấu hình từ .env ────────────────────────────────────────
MODEL_BACKEND    = os.getenv("MODEL_BACKEND", "svm")
MODELS_DIR       = os.getenv("MODELS_DIR", "./models")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX   = os.getenv("PINECONE_INDEX", "dental-kb")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY", "")

LABELS = ['sau_rang','viem_nuou','e_buot','rang_khon',
          'chinh_nha','tham_my','mat_rang','khac']

DISCLAIMER = (
    "⚠️ Kết quả chỉ mang tính tham khảo. "
    "Vui lòng gặp bác sĩ để được chẩn đoán và điều trị chính xác."
)

# ── Load SVM ────────────────────────────────────────────────
import joblib
_svm_pipeline = joblib.load(f"{MODELS_DIR}/svm_pipeline.joblib")
print(f"✅ SVM pipeline loaded")

# ── Load Embedding model (cho RAG) ──────────────────────────
from sentence_transformers import SentenceTransformer
_embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("✅ Embedding model loaded")

# ── Kết nối Pinecone ────────────────────────────────────────
from pinecone import Pinecone
_pc    = Pinecone(api_key=PINECONE_API_KEY)
_index = _pc.Index(PINECONE_INDEX)
print(f"✅ Pinecone connected: {PINECONE_INDEX}")

# ── Gemini client ────────────────────────────────────────────
import google.generativeai as genai
genai.configure(api_key=GEMINI_API_KEY)
_gemini = genai.GenerativeModel("gemini-2.5-flash")
print("✅ Gemini configured")


# ══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════

def preprocess(text: str) -> str:
    return text.strip().lower()


def classify(text: str) -> dict:
    """SVM classify → trả về label + confidence + top3."""
    processed = preprocess(text)
    label     = _svm_pipeline.predict([processed])[0]
    scores    = _svm_pipeline.decision_function([processed])[0]
    scores_exp = np.exp(scores - np.max(scores))
    probs     = scores_exp / scores_exp.sum()
    classes   = _svm_pipeline.classes_

    top_labels = sorted(
        [{"label": c, "confidence": round(float(p), 4)}
         for c, p in zip(classes, probs)],
        key=lambda x: -x["confidence"]
    )
    confidence = round(float(probs[list(classes).index(label)]), 4)

    return {
        "label": label,
        "confidence": confidence,
        "top_labels": top_labels[:3]
    }


def retrieve_context(question: str, _label: str, top_k: int = 3) -> list[dict]:
    """
    RAG retrieval: embed câu hỏi → query Pinecone → trả về top_k chunks.
    Không filter theo namespace để tìm được trong tất cả tài liệu.
    """
    vector = _embed_model.encode(
        question, normalize_embeddings=True
    ).tolist()

    results = _index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True
    )

    context_list = []
    for match in results.matches:
        if match.score > 0.3:  # chỉ lấy kết quả đủ liên quan
            context_list.append({
                "text":   match.metadata.get("text", ""),
                "score":  round(match.score, 4),
                "source": match.metadata.get("source", "unknown")
            })

    return context_list


def build_prompt(question: str, label: str, context_list: list[dict]) -> str:
    """Xây dựng prompt gửi Gemini."""
    label_names = {
        "sau_rang":  "Sâu răng",
        "viem_nuou": "Viêm nướu / Nha chu",
        "e_buot":    "Ê buốt / Nhạy cảm ngà",
        "rang_khon": "Răng khôn",
        "chinh_nha": "Chỉnh nha / Niềng răng",
        "tham_my":   "Nha thẩm mỹ",
        "mat_rang":  "Mất răng / Phục hình",
        "khac":      "Tổng quát"
    }
    label_display = label_names.get(label, label)

    if context_list:
        context_text = "\n\n---\n\n".join(
            f"[Nguồn: {c['source']}]\n{c['text']}"
            for c in context_list
        )
        context_section = f"""
Dưới đây là thông tin chuyên môn từ tài liệu nha khoa liên quan:

{context_text}

---
"""
    else:
        context_section = ""

    prompt = f"""Bạn là trợ lý tư vấn nha khoa chuyên nghiệp. Hãy trả lời câu hỏi của bệnh nhân bằng tiếng Việt, 
ngắn gọn, dễ hiểu, và dựa trên thông tin chuyên môn được cung cấp.

Chủ đề được phân loại: {label_display}
{context_section}
Câu hỏi của bệnh nhân: {question}

Yêu cầu:
- Trả lời trực tiếp, rõ ràng, dùng ngôn ngữ thân thiện
- Nếu có thông tin từ tài liệu, ưu tiên dựa vào đó
- Không đưa ra chẩn đoán chính thức
- Gợi ý đi khám trực tiếp nếu tình trạng nghiêm trọng
- Trả lời trong khoảng 3-5 câu

Câu trả lời:"""

    return prompt


def generate_answer(prompt: str) -> str:
    """Gọi Gemini API để sinh câu trả lời."""
    try:
        response = _gemini.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 1024,
                "temperature": 0.3,  # thấp để câu trả lời ổn định, ít hallucinate
                "top_p": 0.8
            }
        )
        return response.text.strip()
    except Exception as e:
        return f"Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau. (Lỗi: {str(e)})"


# ══════════════════════════════════════════════════════════
# FASTAPI APP
# ══════════════════════════════════════════════════════════

app = FastAPI(
    title="Dental AI Service",
    description="ML classify + RAG retrieval + Gemini generation",
    version="2.0.0"
)


# ── Schema ──────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    text: str
    use_rag: bool = True  # False = chatbot không có ML (để so sánh khi demo)

class EmbedRequest(BaseModel):
    filename: str
    file_bytes_base64: str  # PDF dưới dạng base64

class LabelScore(BaseModel):
    label: str
    confidence: float

class ClassifyResponse(BaseModel):
    label: str
    confidence: float
    top_labels: list[LabelScore]

class ChatResponse(BaseModel):
    answer: str
    disclaimer: str
    ml_result: ClassifyResponse
    context_count: int   # số đoạn RAG tìm được
    use_rag: bool


# ── Endpoints ───────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "dental-ai",
        "model_backend": MODEL_BACKEND,
        "pinecone_index": PINECONE_INDEX,
        "labels": LABELS
    }


@app.post("/classify", response_model=ClassifyResponse)
def classify_endpoint(request: ClassifyRequest):
    """Chỉ classify — Kotlin gọi endpoint này."""
    if not request.text.strip():
        raise HTTPException(400, "text không được để trống")

    result = classify(request.text)
    return ClassifyResponse(
        label=result["label"],
        confidence=result["confidence"],
        top_labels=[LabelScore(**x) for x in result["top_labels"]]
    )


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Luồng đầy đủ: classify → RAG → Gemini → response
    use_rag=False: bỏ qua ML + RAG, chỉ hỏi thẳng Gemini (để demo so sánh)
    """
    if not request.text.strip():
        raise HTTPException(400, "text không được để trống")

    if request.use_rag:
        # ── CÓ ML + RAG ──────────────────────────────────
        # Bước 1: Classify
        ml_result = classify(request.text)

        # Bước 2: RAG retrieval
        context_list = retrieve_context(
            request.text,
            ml_result["label"],
            top_k=3
        )

        # Bước 3: Build prompt + Gemini
        prompt = build_prompt(request.text, ml_result["label"], context_list)
        answer = generate_answer(prompt)

    else:
        # ── KHÔNG CÓ ML + RAG (để so sánh khi demo) ─────
        ml_result = {"label": "khac", "confidence": 0.0, "top_labels": []}
        context_list = []
        simple_prompt = f"""Bạn là trợ lý tư vấn nha khoa. 
Trả lời câu hỏi sau bằng tiếng Việt, ngắn gọn:

{request.text}"""
        answer = generate_answer(simple_prompt)

    return ChatResponse(
        answer=answer,
        disclaimer=DISCLAIMER,
        ml_result=ClassifyResponse(
            label=ml_result["label"],
            confidence=ml_result["confidence"],
            top_labels=[LabelScore(**x) for x in ml_result["top_labels"]]
        ),
        context_count=len(context_list),
        use_rag=request.use_rag
    )


@app.post("/embed")
def embed_endpoint(request: EmbedRequest):
    """
    Admin upload PDF → pipeline tự động xử lý.
    Kotlin Backend gọi endpoint này sau khi nhận file từ admin.
    """
    import base64
    import tempfile
    from rag_pipeline import process_pdf

    try:
        # Decode base64 → file tạm
        pdf_bytes = base64.b64decode(request.file_bytes_base64)
        with tempfile.NamedTemporaryFile(
                suffix=".pdf",
                delete=False,
                prefix=request.filename.replace(".pdf", "_")
        ) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        # Chạy pipeline
        result = process_pdf(tmp_path, _index)

        # Xóa file tạm
        os.unlink(tmp_path)

        return result

    except Exception as e:
        raise HTTPException(500, f"Lỗi xử lý PDF: {str(e)}")