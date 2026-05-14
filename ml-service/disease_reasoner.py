"""
Rule-based disease reasoning from detected dental symptoms.

Input example:
    {"e_buot": 0.91, "dau_khi_nhai": 0.80}

The module scores diseases using weighted symptoms, checks missing required
symptoms, and decides whether the chat agent should conclude or ask a follow-up
question.
"""

from __future__ import annotations

from typing import Any


DISEASE_MAP: dict[str, dict[str, Any]] = {
    "sau_rang": {
        "name": "Sâu răng",
        "symptoms": {
            "sau_rang_nhin_thay": {"weight": 0.35, "required": True},
            "dau_rang": {"weight": 0.25, "required": False},
            "e_buot": {"weight": 0.20, "required": False},
            "dau_khi_nhai": {"weight": 0.10, "required": False},
            "hoi_mieng": {"weight": 0.10, "required": False},
        },
    },
    "viem_tuy": {
        "name": "Viêm tủy răng",
        "symptoms": {
            "nhuc_rang_dem": {"weight": 0.35, "required": True},
            "dau_rang": {"weight": 0.30, "required": True},
            "e_buot": {"weight": 0.20, "required": False},
            "sung_ma": {"weight": 0.15, "required": False},
        },
    },
    "viem_nuou": {
        "name": "Viêm nướu",
        "symptoms": {
            "chay_mau_nuou": {"weight": 0.30, "required": True},
            "sung_nuou": {"weight": 0.30, "required": True},
            "hoi_mieng": {"weight": 0.20, "required": False},
            "dau_rang": {"weight": 0.20, "required": False},
        },
    },
    "viem_nha_chu": {
        "name": "Viêm nha chu",
        "symptoms": {
            "rang_lung_lay": {"weight": 0.25, "required": True},
            "chay_mau_nuou": {"weight": 0.20, "required": True},
            "nuou_tut": {"weight": 0.20, "required": False},
            "hoi_mieng": {"weight": 0.15, "required": False},
            "dau_khi_nhai": {"weight": 0.10, "required": False},
            "sung_nuou": {"weight": 0.10, "required": False},
        },
    },
    "rang_khon_moc_lech": {
        "name": "Răng khôn mọc lệch",
        "symptoms": {
            "rang_khon_dau": {"weight": 0.30, "required": True},
            "sung_nuou": {"weight": 0.20, "required": False},
            "sung_ma": {"weight": 0.20, "required": False},
            "khan_ham": {"weight": 0.15, "required": False},
            "dau_rang": {"weight": 0.15, "required": False},
        },
    },
    "nhay_cam_nga": {
        "name": "Nhạy cảm ngà răng",
        "symptoms": {
            "e_buot": {"weight": 0.40, "required": True},
            "dau_khi_nhai": {"weight": 0.30, "required": False},
            "nuou_tut": {"weight": 0.30, "required": False},
        },
    },
    "gay_vo_rang": {
        "name": "Gãy / vỡ răng",
        "symptoms": {
            "rang_gay": {"weight": 0.40, "required": True},
            "dau_rang": {"weight": 0.30, "required": False},
            "e_buot": {"weight": 0.20, "required": False},
            "dau_khi_nhai": {"weight": 0.10, "required": False},
        },
    },
    "nhiem_trung_rang": {
        "name": "Nhiễm trùng / áp xe răng",
        "symptoms": {
            "sung_ma": {"weight": 0.30, "required": True},
            "dau_rang": {"weight": 0.25, "required": True},
            "nhuc_rang_dem": {"weight": 0.20, "required": False},
            "hoi_mieng": {"weight": 0.15, "required": False},
            "khan_ham": {"weight": 0.10, "required": False},
        },
    },
}


FOLLOWUP_TEMPLATES = {
    "sung_nuou": "Nướu của bạn có bị sưng đỏ không?",
    "chay_mau_nuou": "Khi đánh răng, nướu bạn có hay chảy máu không?",
    "dau_rang": "Bạn có bị đau răng không? Đau ở vị trí nào?",
    "e_buot": "Răng bạn có bị ê buốt khi ăn đồ nóng hoặc lạnh không?",
    "nhuc_rang_dem": "Bạn có bị nhức răng về đêm không?",
    "sau_rang_nhin_thay": "Bạn có nhìn thấy lỗ sâu hoặc đốm đen trên răng không?",
    "dau_khi_nhai": "Bạn có bị đau khi nhai thức ăn không?",
    "rang_lung_lay": "Bạn có cảm giác răng bị lung lay không?",
    "nuou_tut": "Nướu bạn có bị tụt, lộ chân răng không?",
    "hoi_mieng": "Bạn có bị hôi miệng không?",
    "rang_khon_dau": "Bạn có bị đau ở vùng răng trong cùng (răng khôn) không?",
    "sung_ma": "Má bạn có bị sưng không?",
    "khan_ham": "Bạn có bị khó há miệng không?",
    "rang_gay": "Răng bạn có bị gãy, vỡ hoặc mẻ không?",
    "rang_doi_mau": "Răng bạn có bị đổi màu hoặc ố vàng không?",
}


CONFIDENCE_THRESHOLD = 0.7
MAX_FOLLOWUPS = 3


def normalize_detected_symptoms(detected_symptoms: dict[str, float]) -> dict[str, float]:
    """Clamp incoming symptom confidences to [0, 1] and drop non-numeric values."""
    normalized = {}
    for symptom, confidence in detected_symptoms.items():
        try:
            value = float(confidence)
        except (TypeError, ValueError):
            continue
        normalized[symptom] = min(max(value, 0.0), 1.0)
    return normalized


def score_diseases(detected_symptoms: dict[str, float]) -> list[dict[str, Any]]:
    """
    Score all diseases from detected symptoms.

    Output is sorted by descending score:
        [
            {
                "disease": "nhay_cam_nga",
                "name": "Nhạy cảm ngà răng",
                "score": 0.364,
                "missing_required": [],
            },
            ...
        ]
    """
    detected = normalize_detected_symptoms(detected_symptoms)
    results = []

    for disease_code, disease_info in DISEASE_MAP.items():
        total_weight = 0.0
        weighted_sum = 0.0
        missing_required = []

        for symptom, config in disease_info["symptoms"].items():
            weight = float(config["weight"])
            total_weight += weight
            if symptom in detected:
                weighted_sum += weight * detected[symptom]
            elif config["required"]:
                missing_required.append(symptom)

        score = weighted_sum / total_weight if total_weight > 0 else 0.0

        results.append({
            "disease": disease_code,
            "name": disease_info["name"],
            "score": round(score, 3),
            "missing_required": missing_required,
        })

    results.sort(key=lambda item: item["score"], reverse=True)
    return results


def get_followup_question(
    detected_symptoms: dict[str, float],
    scores: list[dict[str, Any]],
) -> str | None:
    """
    Ask for the first missing required symptom of the top disease.

    If no required symptom is missing but score is still below threshold, ask
    about the highest-weight missing symptom for the top disease.
    """
    if not scores:
        return None

    top_disease = scores[0]
    missing = top_disease["missing_required"]
    if missing:
        symptom_to_ask = missing[0]
    else:
        disease_info = DISEASE_MAP.get(top_disease["disease"], {})
        detected = normalize_detected_symptoms(detected_symptoms)
        candidates = [
            (symptom, config["weight"])
            for symptom, config in disease_info.get("symptoms", {}).items()
            if symptom not in detected
        ]
        if not candidates:
            return None
        symptom_to_ask = max(candidates, key=lambda item: item[1])[0]
    return FOLLOWUP_TEMPLATES.get(
        symptom_to_ask,
        f"Bạn có triệu chứng {symptom_to_ask} không?",
    )


def should_conclude(scores: list[dict[str, Any]], followup_count: int) -> bool:
    """
    Conclude if the top disease is confident enough with all required symptoms,
    or if the conversation already asked too many follow-up questions.
    """
    if followup_count >= MAX_FOLLOWUPS:
        return True

    if not scores:
        return True

    top = scores[0]
    return top["score"] >= CONFIDENCE_THRESHOLD and len(top["missing_required"]) == 0


def reason(detected_symptoms: dict[str, float], followup_count: int) -> dict[str, Any]:
    """
    Main reasoning function used by the chat agent.

    Output:
        {
            "action": "conclude" | "followup",
            "scores": [...],
            "top_disease": "viem_nuou",
            "top_disease_name": "Viêm nướu",
            "top_score": 0.82,
            "followup_question": None | "...",
        }
    """
    scores = score_diseases(detected_symptoms)
    conclude = should_conclude(scores, followup_count)
    top = scores[0] if scores else None

    return {
        "action": "conclude" if conclude else "followup",
        "scores": scores[:3],
        "top_disease": top["disease"] if top else None,
        "top_disease_name": top["name"] if top else None,
        "top_score": top["score"] if top else 0,
        "followup_question": None if conclude else get_followup_question(detected_symptoms, scores),
    }


if __name__ == "__main__":
    import sys

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    examples = [
        ({"e_buot": 0.91}, 0),
        ({"e_buot": 0.91, "dau_khi_nhai": 0.80}, 1),
        ({"e_buot": 0.91, "dau_khi_nhai": 0.80, "nuou_tut": 0.75}, 2),
    ]
    for symptoms, count in examples:
        print(reason(symptoms, count))
