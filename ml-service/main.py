from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Dental ML Service")


class ClassifyRequest(BaseModel):
    text: str


class LabelScore(BaseModel):
    label: str
    confidence: float


class ClassifyResponse(BaseModel):
    label: str
    confidence: float
    top_labels: list[LabelScore]


@app.get("/health")
def health():
    return {"status": "ok", "service": "dental-ml"}


@app.post("/classify", response_model=ClassifyResponse)
def classify(request: ClassifyRequest):
    # Mock response — sẽ thay bằng model thật sau khi train
    return ClassifyResponse(
        label="sau_rang",
        confidence=0.87,
        top_labels=[
            LabelScore(label="sau_rang", confidence=0.87),
            LabelScore(label="viem_nuou", confidence=0.09),
            LabelScore(label="e_buot", confidence=0.04),
        ],
    )
