"""
ml-service/main.py
Dental ML Service — FastAPI
Tích hợp: SVM classify + PhoBERT classify + RAG retrieval + Gemini generation
"""

from dotenv import load_dotenv
load_dotenv()

import os
import json
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from underthesea import word_tokenize

# ── Cấu hình từ .env ────────────────────────────────────────
MODEL_BACKEND    = os.getenv("MODEL_BACKEND", "svm")   # "svm" | "phobert"
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

# ── PhoBERT — lazy load (nặng, chỉ load khi cần) ────────────
_phobert_model      = None
_phobert_tokenizer  = None
_phobert_label_map  = None  # {0: "chinh_nha", 1: "e_buot", ...}

def _load_phobert():
    global _phobert_model, _phobert_tokenizer, _phobert_label_map
    if _phobert_model is not None:
        return
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    phobert_dir = f"{MODELS_DIR}/phobert_best"
    print("Loading PhoBERT model...")
    _phobert_tokenizer = AutoTokenizer.from_pretrained(phobert_dir)
    _phobert_model     = AutoModelForSequenceClassification.from_pretrained(phobert_dir)
    _phobert_model.eval()
    with open(f"{MODELS_DIR}/label_map.json", encoding="utf-8") as f:
        raw = json.load(f)
        _phobert_label_map = {int(k): v for k, v in raw.items()}
    print("✅ PhoBERT loaded")

# ── Load Embedding model (cho RAG) ──────────────────────────
from sentence_transformers import SentenceTransformer
_embed_model = SentenceTransformer("bkai-foundation-models/vietnamese-bi-encoder")
print("✅ Embedding model loaded")

# ── Kết nối Pinecone ────────────────────────────────────────
_pc    = None
_index = None


def get_pinecone_index():
    global _pc, _index
    if _index is None:
        from pinecone import Pinecone
        _pc = Pinecone(api_key=PINECONE_API_KEY)
        _index = _pc.Index(PINECONE_INDEX)
        print(f"✅ Pinecone connected: {PINECONE_INDEX}")
    return _index

# ── Gemini client ────────────────────────────────────────────
_gemini = None


def get_gemini_model():
    global _gemini
    if _gemini is None:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini = genai.GenerativeModel("gemini-2.5-flash-lite")
        print("✅ Gemini configured")
    return _gemini


# ══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════

def preprocess(text: str) -> str:
    return word_tokenize(text.strip().lower(), format="text")


def classify_svm(text: str) -> dict:
    """SVM classify → trả về label + confidence + top3."""
    processed = preprocess(text)
    label     = _svm_pipeline.predict([processed])[0]
    probs     = _svm_pipeline.predict_proba([processed])[0]
    classes   = _svm_pipeline.classes_

    top_labels = sorted(
        [{"label": c, "confidence": round(float(p), 4)}
         for c, p in zip(classes, probs)],
        key=lambda x: -x["confidence"]
    )
    confidence = round(float(probs[list(classes).index(label)]), 4)
    return {"label": label, "confidence": confidence, "top_labels": top_labels[:3]}


def classify_phobert(text: str) -> dict:
    """PhoBERT (Deep Learning) classify → trả về label + confidence + top3."""
    import torch
    _load_phobert()
    inputs = _phobert_tokenizer(
        preprocess(text),
        return_tensors="pt",
        truncation=True,
        max_length=256,
        padding=True
    )
    with torch.no_grad():
        logits = _phobert_model(**inputs).logits
    probs     = torch.softmax(logits, dim=-1)[0].tolist()
    label_idx = int(np.argmax(probs))
    label     = _phobert_label_map[label_idx]

    top_labels = sorted(
        [{"label": _phobert_label_map[i], "confidence": round(p, 4)}
         for i, p in enumerate(probs)],
        key=lambda x: -x["confidence"]
    )
    return {"label": label, "confidence": round(probs[label_idx], 4), "top_labels": top_labels[:3]}


def classify(text: str) -> dict:
    """Classify dùng model được chọn qua MODEL_BACKEND env."""
    if MODEL_BACKEND == "phobert":
        return classify_phobert(text)
    return classify_svm(text)


PINECONE_NAMESPACES = [
    "phac_do_dieu_tri_bv_rhm_2023",
    "quytrinhchuyenmonbvrhm",
    "rang_ham_mat",
]

def retrieve_context(question: str, _label: str, top_k: int = 3) -> list[dict]:
    """
    RAG retrieval: embed câu hỏi → query từng namespace trên Pinecone → trả về top_k chunks tốt nhất.
    """
    vector = _embed_model.encode(
        question, normalize_embeddings=True
    ).tolist()

    all_matches = []
    index = get_pinecone_index()
    for ns in PINECONE_NAMESPACES:
        results = index.query(
            vector=vector,
            top_k=2,
            include_metadata=True,
            namespace=ns
        )
        for match in results.matches:
            all_matches.append({
                "text":   match.metadata.get("text", ""),
                "score":  round(match.score, 4),
                "source": match.metadata.get("source", "unknown")
            })

    all_matches.sort(key=lambda x: -x["score"])
    return [m for m in all_matches[:top_k] if m["score"] > 0.3]


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
    # Allow a mock mode for offline/testing (set MOCK_GEMINI=1 in .env or env)
    if os.getenv("MOCK_GEMINI", "") == "1":
        # Return a short deterministic mock answer based on the prompt's first line
        first_line = prompt.splitlines()[0][:200]
        return f"[MOCK ANSWER] Dựa trên thông tin: {first_line}... (mock)"

    try:
        response = get_gemini_model().generate_content(
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

class CompareResponse(BaseModel):
    text: str
    svm: ClassifyResponse
    phobert: ClassifyResponse
    agreement: bool   # True nếu 2 model cùng dự đoán label


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
    """Classify dùng MODEL_BACKEND đang cấu hình (svm hoặc phobert) — Kotlin gọi endpoint này."""
    if not request.text.strip():
        raise HTTPException(400, "text không được để trống")

    result = classify(request.text)
    return ClassifyResponse(
        label=result["label"],
        confidence=result["confidence"],
        top_labels=[LabelScore(**x) for x in result["top_labels"]]
    )


@app.post("/compare", response_model=CompareResponse)
def compare_endpoint(request: ClassifyRequest):
    """
    Chạy cả SVM lẫn PhoBERT trên cùng 1 câu hỏi.
    Dùng để demo so sánh 2 mô hình cho hội đồng.
    """
    if not request.text.strip():
        raise HTTPException(400, "text không được để trống")

    svm_result     = classify_svm(request.text)
    phobert_result = classify_phobert(request.text)

    return CompareResponse(
        text=request.text,
        svm=ClassifyResponse(
            label=svm_result["label"],
            confidence=svm_result["confidence"],
            top_labels=[LabelScore(**x) for x in svm_result["top_labels"]]
        ),
        phobert=ClassifyResponse(
            label=phobert_result["label"],
            confidence=phobert_result["confidence"],
            top_labels=[LabelScore(**x) for x in phobert_result["top_labels"]]
        ),
        agreement=(svm_result["label"] == phobert_result["label"])
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
        result = process_pdf(tmp_path, get_pinecone_index())

        # Xóa file tạm
        os.unlink(tmp_path)

        return result

    except Exception as e:
        raise HTTPException(500, f"Lỗi xử lý PDF: {str(e)}")