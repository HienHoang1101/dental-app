from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import os
from threading import Lock
from typing import Any

import google.generativeai as genai
import joblib
import torch
from torch import nn
from transformers import AutoModel, AutoTokenizer

from disease_reasoner import reason
from prompts import (
    DOCTOR_PROMPT,
    FOLLOWUP_PROMPT,
    REJECT_PROMPT,
    ROUTER_PROMPT,
    SERVICE_PROMPT,
    SYMPTOM_RESPONSE_PROMPT,
)
from rag_pipeline import search_context, search_context_for_diagnosis


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_DIR = os.getenv("PHOBERT_MULTILABEL_DIR", "models/phobert_multilabel_group_tuned")
AGENT_GEMINI_MODEL = os.getenv("AGENT_GEMINI_MODEL", "gemini-2.5-flash-lite")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DISCLAIMER = (
    "\n\n⚠️ Kết quả chỉ mang tính tham khảo. "
    "Vui lòng gặp bác sĩ để được chẩn đoán chính xác."
)


class PhoBERTMultiLabel(nn.Module):
    """PhoBERT encoder + linear head for symptom multi-label classification."""

    def __init__(self, num_labels: int) -> None:
        super().__init__()
        self.bert = AutoModel.from_pretrained("vinai/phobert-base-v2")
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(768, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0, :]
        cls_output = self.dropout(cls_output)
        return self.classifier(cls_output)


# Lazy-loaded resources to avoid heavy startup and keep import resilient.
_tokenizer = None
_mlb = None
_ml_model = None
_gemini = None
_ml_lock = Lock()
_gemini_lock = Lock()


# In-memory session store for MVP. Production should move this to Redis/DB.
sessions: dict[str, dict[str, Any]] = {}


def _ensure_ml_loaded() -> tuple[Any, Any, nn.Module]:
    global _tokenizer, _mlb, _ml_model

    if _tokenizer is not None and _mlb is not None and _ml_model is not None:
        return _tokenizer, _mlb, _ml_model

    with _ml_lock:
        if _tokenizer is not None and _mlb is not None and _ml_model is not None:
            return _tokenizer, _mlb, _ml_model

        tokenizer_path = os.path.join(MODEL_DIR, "tokenizer")
        mlb_path = os.path.join(MODEL_DIR, "mlb.joblib")
        model_path = os.path.join(MODEL_DIR, "model.pt")

        if not (os.path.exists(tokenizer_path) and os.path.exists(mlb_path) and os.path.exists(model_path)):
            raise FileNotFoundError(
                "PhoBERT multilabel artifacts not found. "
                f"Expected tokenizer/mlb/model.pt under: {MODEL_DIR}"
            )

        _tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        _mlb = joblib.load(mlb_path)

        model = PhoBERTMultiLabel(num_labels=len(_mlb.classes_))
        state_dict = torch.load(model_path, map_location=DEVICE)
        model.load_state_dict(state_dict)
        model.to(DEVICE)
        model.eval()
        _ml_model = model

    return _tokenizer, _mlb, _ml_model


def _get_gemini_model():
    global _gemini

    if _gemini is not None:
        return _gemini

    with _gemini_lock:
        if _gemini is not None:
            return _gemini

        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")

        genai.configure(api_key=GEMINI_API_KEY)
        _gemini = genai.GenerativeModel(AGENT_GEMINI_MODEL)

    return _gemini


def _generate_text(prompt: str) -> str:
    """Gemini call wrapper with safe fallback for local/offline testing."""
    if os.getenv("MOCK_GEMINI", "") == "1":
        return "[MOCK] Xin chao ban. Day la cau tra loi mau de test pipeline."

    try:
        response = _get_gemini_model().generate_content(
            prompt,
            generation_config={"temperature": 0.3, "top_p": 0.8, "max_output_tokens": 800},
        )
        text = (response.text or "").strip()
        return text or "Xin loi, toi chua the tao cau tra loi luc nay."
    except Exception:
        # Keep this generic to avoid leaking key/config internals in user-facing chat.
        return "Xin loi, he thong dang ban. Ban vui long thu lai sau it phut."


def classify_symptoms(text: str, threshold: float = 0.5) -> dict[str, float]:
    """
    Multi-label symptom classifier output.

    Example:
        Input:  "nuou sung do va chay mau khi danh rang"
        Output: {"sung_nuou": 0.92, "chay_mau_nuou": 0.88}
    """
    text = (text or "").strip()
    if not text:
        return {}

    tokenizer, mlb, model = _ensure_ml_loaded()

    encoding = tokenizer(
        text,
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )
    input_ids = encoding["input_ids"].to(DEVICE)
    attention_mask = encoding["attention_mask"].to(DEVICE)

    with torch.no_grad():
        logits = model(input_ids, attention_mask)
        probs = torch.sigmoid(logits).cpu().numpy()[0]

    results: dict[str, float] = {}
    for idx, label in enumerate(mlb.classes_):
        if probs[idx] >= threshold:
            results[str(label)] = round(float(probs[idx]), 3)

    return results


def get_session(session_id: str) -> dict[str, Any]:
    if session_id not in sessions:
        sessions[session_id] = {
            "detected_symptoms": {},
            "followup_count": 0,
            "chat_history": [],
            "is_resolved": False,
        }
    return sessions[session_id]


def update_symptoms(session_id: str, new_symptoms: dict[str, float]) -> None:
    """Merge new symptoms and keep higher confidence for duplicated keys."""
    session = get_session(session_id)
    for symptom, confidence in new_symptoms.items():
        current = session["detected_symptoms"].get(symptom, 0.0)
        session["detected_symptoms"][symptom] = max(current, confidence)


def format_chat_history(history: list[dict[str, str]]) -> str:
    if not history:
        return "(Chua co hoi thoai truoc do)"

    lines = []
    for msg in history[-10:]:
        role = "Benh nhan" if msg.get("role") == "user" else "Tro ly"
        lines.append(f"{role}: {msg.get('content', '')}")
    return "\n".join(lines)


def route_intent(message: str) -> str:
    """
    Output: symptom | service | doctor | booking | reject
    """
    # Deterministic keyword shortcut before LLM routing to reduce latency/cost.
    text = (message or "").lower()
    if any(key in text for key in ["dat lich", "lich hen", "booking", "hen kham"]):
        return "booking"
    if any(key in text for key in ["bac si", "chuyen mon bac si", "doi ngu bac si"]):
        return "doctor"
    if any(key in text for key in ["gia", "chi phi", "dich vu", "nieng", "implant", "tay trang"]):
        return "service"

    response_text = _generate_text(ROUTER_PROMPT.format(message=message)).strip().lower()
    for intent in ["symptom", "service", "doctor", "booking", "reject"]:
        if intent in response_text:
            return intent
    return "symptom"


def _append_history(session: dict[str, Any], message: str, reply: str) -> None:
    session["chat_history"].append({"role": "user", "content": message})
    session["chat_history"].append({"role": "assistant", "content": reply})

    # Keep up to 20 turns (~40 entries user+assistant).
    if len(session["chat_history"]) > 40:
        session["chat_history"] = session["chat_history"][-40:]


def handle_symptom(session_id: str, message: str) -> dict[str, Any]:
    """Main flow: classify -> aggregate -> reason -> follow-up or conclude."""
    session = get_session(session_id)
    new_symptoms = classify_symptoms(message)
    update_symptoms(session_id, new_symptoms)

    reasoning = reason(
        detected_symptoms=session["detected_symptoms"],
        followup_count=session["followup_count"],
    )

    if reasoning["action"] == "followup":
        session["followup_count"] += 1
        prompt = FOLLOWUP_PROMPT.format(
            chat_history=format_chat_history(session["chat_history"]),
            user_message=message,
            detected_symptoms=list(session["detected_symptoms"].keys()),
            top_disease=reasoning["top_disease_name"],
            top_score=reasoning["top_score"],
            followup_hint=reasoning.get("followup_question") or "Hoi them trieu chung noi bat.",
        )
        reply = _generate_text(prompt)
        context_count = 0
    else:
        session["is_resolved"] = True

        symptom_names = list(session["detected_symptoms"].keys())
        try:
            rag_context = search_context_for_diagnosis(
                symptoms=symptom_names,
                disease_name=reasoning["top_disease_name"],
                top_k=5,
            )
        except Exception:
            rag_context = []

        rag_text = "\n---\n".join(rag_context) if rag_context else "Khong co tai lieu lien quan."
        prompt = SYMPTOM_RESPONSE_PROMPT.format(
            chat_history=format_chat_history(session["chat_history"]),
            user_message=message,
            detected_symptoms=session["detected_symptoms"],
            top_disease=reasoning["top_disease_name"],
            top_score=reasoning["top_score"],
            all_scores=reasoning["scores"],
            rag_context=rag_text,
        )
        reply = _generate_text(prompt)
        context_count = len(rag_context)

    _append_history(session, message, reply)

    return {
        "reply": reply,
        "detected_symptoms": new_symptoms,
        "all_symptoms": session["detected_symptoms"],
        "reasoning": reasoning,
        "is_resolved": session["is_resolved"],
        "context_count": context_count,
    }


def handle_service(session_id: str, message: str) -> dict[str, Any]:
    session = get_session(session_id)
    try:
        rag_context = search_context(message, top_k=5)
    except Exception:
        rag_context = []

    rag_text = "\n---\n".join(rag_context) if rag_context else "Khong co thong tin."
    prompt = SERVICE_PROMPT.format(
        chat_history=format_chat_history(session["chat_history"]),
        user_message=message,
        rag_context=rag_text,
    )
    reply = _generate_text(prompt)
    _append_history(session, message, reply)
    return {"reply": reply, "context_count": len(rag_context)}


def handle_doctor(session_id: str, message: str) -> dict[str, Any]:
    session = get_session(session_id)
    try:
        rag_context = search_context(message, top_k=5)
    except Exception:
        rag_context = []

    rag_text = "\n---\n".join(rag_context) if rag_context else "Khong co thong tin."
    prompt = DOCTOR_PROMPT.format(
        chat_history=format_chat_history(session["chat_history"]),
        user_message=message,
        rag_context=rag_text,
    )
    reply = _generate_text(prompt)
    _append_history(session, message, reply)
    return {"reply": reply, "context_count": len(rag_context)}


def handle_booking(session_id: str, message: str) -> dict[str, Any]:
    reply = (
        "Ban co the dat lich kham truc tiep tren ung dung. "
        'Nhan vao muc "Dat lich kham" de chon bac si, dich vu va thoi gian phu hop.'
    )
    session = get_session(session_id)
    _append_history(session, message, reply)
    return {"reply": reply, "context_count": 0}


def handle_reject(session_id: str, message: str) -> dict[str, Any]:
    prompt = REJECT_PROMPT.format(message=message)
    reply = _generate_text(prompt)
    session = get_session(session_id)
    _append_history(session, message, reply)
    return {"reply": reply, "context_count": 0}


def chat(session_id: str, message: str) -> dict[str, Any]:
    """
    Unified entry point for agent orchestration.

    Returns a dict with at least: reply + intent.
    Symptom route also includes reasoning metadata.
    """
    session_id = (session_id or "default").strip() or "default"
    message = (message or "").strip()
    if not message:
        return {
            "intent": "reject",
            "reply": "Ban vui long nhap noi dung can tu van.",
            "context_count": 0,
        }

    intent = route_intent(message)

    if intent == "symptom":
        result = handle_symptom(session_id, message)
    elif intent == "service":
        result = handle_service(session_id, message)
    elif intent == "doctor":
        result = handle_doctor(session_id, message)
    elif intent == "booking":
        result = handle_booking(session_id, message)
    else:
        result = handle_reject(session_id, message)

    result["intent"] = intent

    if intent in {"symptom", "service", "doctor"}:
        result["reply"] += DISCLAIMER

    return result
