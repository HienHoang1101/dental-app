"""FastAPI server for the multi-agent dental ML service."""

from __future__ import annotations

from contextlib import asynccontextmanager
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

load_dotenv()

# Heavy modules are loaded once in lifespan, then reused by all requests.
agent = None
rag = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global agent, rag
    print("Loading models...")
    import agent as agent_module
    import rag_pipeline as rag_module

    agent = agent_module
    rag = rag_module
    print("Models loaded!")
    yield
    print("Server shutting down.")


app = FastAPI(title="Dental AI Service", version="2.0", lifespan=lifespan)


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    intent: str | None = None
    detected_symptoms: dict | None = None
    all_symptoms: dict | None = None
    reasoning: dict | None = None
    is_resolved: bool | None = None


class ClassifyRequest(BaseModel):
    text: str


class ClassifyResponse(BaseModel):
    detected_symptoms: dict


class EmbedResponse(BaseModel):
    namespace: str
    chunk_count: int
    status: str


def _ensure_modules_loaded() -> None:
    if agent is None or rag is None:
        raise HTTPException(status_code=503, detail="Service is still initializing")


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """Patient sends message -> agent handles routing/reasoning -> returns reply."""
    if not req.session_id.strip():
        raise HTTPException(status_code=400, detail="session_id khong duoc de trong")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message khong duoc de trong")

    _ensure_modules_loaded()
    try:
        result = agent.chat(req.session_id, req.message)
        return ChatResponse(
            reply=result["reply"],
            intent=result.get("intent"),
            detected_symptoms=result.get("detected_symptoms"),
            all_symptoms=result.get("all_symptoms"),
            reasoning=result.get("reasoning"),
            is_resolved=result.get("is_resolved"),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/classify", response_model=ClassifyResponse)
def classify_endpoint(req: ClassifyRequest):
    """Debug/admin endpoint: run symptom classifier directly on one sentence."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text khong duoc de trong")

    _ensure_modules_loaded()
    try:
        symptoms = agent.classify_symptoms(req.text)
        return ClassifyResponse(detected_symptoms=symptoms)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/embed-doc", response_model=EmbedResponse)
async def embed_doc_endpoint(file: UploadFile = File(...)):
    """Admin uploads a PDF -> chunk/embed -> store in Pinecone."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chi chap nhan file PDF")

    _ensure_modules_loaded()
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}.pdf")
    max_size = 20 * 1024 * 1024
    total_written = 0

    try:
        with open(temp_path, "wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_written += len(chunk)
                if total_written > max_size:
                    raise HTTPException(status_code=400, detail="File qua lon (toi da 20MB)")
                output.write(chunk)

        namespace = file.filename.replace(".pdf", "").replace(" ", "_").lower()
        result = rag.upload_pdf(temp_path, namespace)
        return EmbedResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        await file.close()
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.delete("/knowledge/{namespace}")
def delete_knowledge_endpoint(namespace: str):
    """Delete one document namespace from knowledge base."""
    if not namespace.strip():
        raise HTTPException(status_code=400, detail="namespace khong duoc de trong")

    _ensure_modules_loaded()
    try:
        return rag.delete_document(namespace)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/knowledge")
def list_knowledge_endpoint():
    """List all uploaded knowledge namespaces."""
    _ensure_modules_loaded()
    try:
        namespaces = rag.list_namespaces()
        return {"documents": namespaces}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
