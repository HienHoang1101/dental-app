# Dental ML Service

FastAPI service for dental symptom classification (SVM), RAG retrieval (Pinecone), and Gemini generation.

## Prerequisites
- Python 3.10+ recommended.
- Pinecone account (API key + index name).
- Gemini API key.
- Model file: `models/svm_pipeline.joblib` (required by `main.py`).

## 1) Install dependencies
```powershell
cd D:\dental-app\ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2) Configure environment
Create a `.env` file in `ml-service/`:
```
PINECONE_API_KEY=xxx
PINECONE_INDEX=dental-kb
PINECONE_REGION=us-east-1
GEMINI_API_KEY=xxx
MODEL_BACKEND=svm
MODELS_DIR=./models
```

## 3) Upload PDF to Pinecone (run once)
```powershell
python -m dotenv -f .env -- python rag_pipeline.py --dir .\pdf_docs\
```

## 4) Test RAG query
```powershell
python -m dotenv -f .env -- python rag_pipeline.py --query "răng bị đau nhức có lỗ đen"
```

## 5) Run FastAPI
```powershell
uvicorn main:app --reload --port 8000 --env-file .env
```

## Endpoints for Kotlin
- `POST /classify` — classify triệu chứng, trả về nhãn ML.
- `POST /chat` — luồng đầy đủ ML + RAG + Gemini, có `use_rag=false` để demo so sánh CÓ/KHÔNG CÓ ML.

## Optional Admin Endpoint
- `POST /embed` — upload PDF (base64) and run the RAG pipeline.

