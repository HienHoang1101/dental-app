"""
ml-service/rag_pipeline.py

RAG Pipeline — Dental Knowledge Base
Đọc PDF → Chunk → Embed → Upsert lên Pinecone

Dùng để:
1. Admin upload PDF mới → gọi script này
2. Hoặc Backend Kotlin gọi endpoint /embed của FastAPI

Chạy thủ công:
    python rag_pipeline.py --pdf path/to/file.pdf
    python rag_pipeline.py --dir path/to/pdf_folder/
"""

import os
import re
import uuid
import argparse
from pathlib import Path
from typing import Generator

# ── Thư viện cần cài ──────────────────────────────────────
# pip install pinecone-client sentence-transformers pypdf2
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
import PyPDF2

# ── Cấu hình ───────────────────────────────────────────────
PINECONE_API_KEY  = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX    = os.getenv("PINECONE_INDEX", "dental-kb")
PINECONE_REGION   = os.getenv("PINECONE_REGION", "us-east-1")  # Singapore nếu bạn chọn region đó

EMBED_MODEL_NAME  = "sentence-transformers/all-MiniLM-L6-v2"
EMBED_DIMENSION   = 384   # phải khớp với index dimension trên Pinecone

CHUNK_SIZE        = 500   # số ký tự mỗi chunk
CHUNK_OVERLAP     = 50    # số ký tự overlap giữa các chunk
BATCH_SIZE        = 100   # số vector upsert mỗi lần (Pinecone limit)

# ── Load embedding model (1 lần duy nhất) ──────────────────
print(f"Loading embedding model: {EMBED_MODEL_NAME}")
_embed_model = SentenceTransformer(EMBED_MODEL_NAME)
print("✅ Embedding model loaded")


# ══════════════════════════════════════════════════════════
# 1. ĐỌC PDF
# ══════════════════════════════════════════════════════════

def read_pdf(pdf_path: str) -> str:
    """Đọc toàn bộ text từ file PDF."""
    text = ""
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n[Trang {page_num + 1}]\n{page_text}"
    return text


def clean_text(text: str) -> str:
    """Làm sạch text: bỏ ký tự thừa, chuẩn hóa khoảng trắng."""
    # Bỏ ký tự đặc biệt không cần thiết
    text = re.sub(r'\x00', '', text)
    # Chuẩn hóa xuống dòng
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Chuẩn hóa khoảng trắng
    text = re.sub(r' {2,}', ' ', text)
    # Bỏ dòng chỉ có số (số trang)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    return text.strip()


# ══════════════════════════════════════════════════════════
# 2. CHUNK TEXT
# ══════════════════════════════════════════════════════════

def chunk_text(
        text: str,
        chunk_size: int = CHUNK_SIZE,
        overlap: int = CHUNK_OVERLAP
) -> Generator[str, None, None]:
    """
    Chia text thành các đoạn nhỏ có overlap.
    Ưu tiên cắt tại dấu chấm/xuống dòng để giữ ngữ nghĩa.
    """
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        # Nếu chưa đến cuối, tìm điểm cắt tự nhiên
        if end < text_len:
            # Tìm dấu chấm, xuống dòng gần nhất
            for sep in ['\n\n', '.\n', '. ', '\n']:
                pos = text.rfind(sep, start, end)
                if pos != -1:
                    end = pos + len(sep)
                    break

        chunk = text[start:end].strip()
        if len(chunk) > 50:  # bỏ chunk quá ngắn
            yield chunk

        start = end - overlap


# ══════════════════════════════════════════════════════════
# 3. EMBED
# ══════════════════════════════════════════════════════════

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Chuyển danh sách text thành danh sách vector 384 chiều."""
    embeddings = _embed_model.encode(
        texts,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True  # chuẩn hóa để cosine = dot product
    )
    return embeddings.tolist()


# ══════════════════════════════════════════════════════════
# 4. UPSERT LÊN PINECONE
# ══════════════════════════════════════════════════════════

def get_pinecone_index():
    """Kết nối Pinecone và trả về index object."""
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY chưa được set trong .env")

    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Tạo index nếu chưa có (idempotent)
    existing = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX not in existing:
        print(f"Tạo index mới: {PINECONE_INDEX}")
        pc.create_index(
            name=PINECONE_INDEX,
            dimension=EMBED_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region=PINECONE_REGION)
        )
        print("✅ Index created")
    else:
        print(f"✅ Index đã tồn tại: {PINECONE_INDEX}")

    return pc.Index(PINECONE_INDEX)


def upsert_to_pinecone(
        index,
        chunks: list[str],
        embeddings: list[list[float]],
        namespace: str,
        source_file: str
):
    """
    Upsert vectors lên Pinecone theo batch.
    Mỗi vector kèm metadata: text gốc + tên file nguồn.
    """
    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vector_id = f"{namespace}_{i:04d}"
        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {
                "text": chunk[:1000],  # Pinecone giới hạn metadata size
                "source": source_file,
                "namespace": namespace,
                "chunk_index": i
            }
        })

    # Upsert theo batch
    total = len(vectors)
    for i in range(0, total, BATCH_SIZE):
        batch = vectors[i:i + BATCH_SIZE]
        index.upsert(vectors=batch, namespace=namespace)
        print(f"  Upserted {min(i + BATCH_SIZE, total)}/{total} vectors")

    print(f"✅ Done: {total} vectors → namespace '{namespace}'")
    return total


# ══════════════════════════════════════════════════════════
# 5. PIPELINE CHÍNH
# ══════════════════════════════════════════════════════════

def process_pdf(pdf_path: str, index) -> dict:
    """
    Xử lý 1 file PDF hoàn chỉnh:
    đọc → clean → chunk → embed → upsert Pinecone
    Trả về dict kết quả để lưu vào DB (knowledge_documents)
    """
    pdf_path = Path(pdf_path)
    filename = pdf_path.name
    # Namespace = tên file không có extension, dùng làm ID trong Pinecone
    namespace = re.sub(r'[^a-z0-9_]', '_', pdf_path.stem.lower())

    print(f"\n{'='*50}")
    print(f"📄 Đang xử lý: {filename}")
    print(f"   Namespace:  {namespace}")

    # Bước 1: Đọc PDF
    print("  [1/4] Đọc PDF...")
    raw_text = read_pdf(str(pdf_path))
    clean = clean_text(raw_text)
    print(f"  → {len(clean)} ký tự sau khi clean")

    if len(clean) < 100:
        print("  ⚠️ File quá ngắn hoặc không đọc được text (có thể là PDF scan)")
        return {"status": "failed", "reason": "Không đọc được text từ PDF"}

    # Bước 2: Chunk
    print(f"  [2/4] Chunking (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})...")
    chunks = list(chunk_text(clean))
    print(f"  → {len(chunks)} chunks")

    # Bước 3: Embed
    print(f"  [3/4] Embedding {len(chunks)} chunks...")
    embeddings = embed_texts(chunks)
    print(f"  → {len(embeddings)} vectors (dim={EMBED_DIMENSION})")

    # Bước 4: Upsert
    print(f"  [4/4] Upsert lên Pinecone...")
    total = upsert_to_pinecone(index, chunks, embeddings, namespace, filename)

    return {
        "status": "completed",
        "filename": filename,
        "namespace": namespace,
        "chunk_count": total
    }


def process_directory(dir_path: str, index) -> list[dict]:
    """Xử lý tất cả PDF trong một thư mục."""
    results = []
    pdf_files = list(Path(dir_path).glob("*.pdf"))

    if not pdf_files:
        print(f"Không tìm thấy file PDF nào trong {dir_path}")
        return results

    print(f"Tìm thấy {len(pdf_files)} file PDF")
    for pdf_file in pdf_files:
        result = process_pdf(str(pdf_file), index)
        results.append(result)

    return results


# ══════════════════════════════════════════════════════════
# 6. HÀM QUERY (dùng khi chatbot cần tìm context)
# ══════════════════════════════════════════════════════════

def query_knowledge_base(
        question: str,
        index,
        top_k: int = 3,
        namespace: str = None  # None = tìm trong tất cả namespace
) -> list[dict]:
    """
    Tìm top_k đoạn văn liên quan nhất với câu hỏi.
    Trả về list dict gồm: text, score, source.
    """
    # Embed câu hỏi
    question_vector = _embed_model.encode(
        question,
        normalize_embeddings=True
    ).tolist()

    # Query Pinecone
    query_params = {
        "vector": question_vector,
        "top_k": top_k,
        "include_metadata": True
    }
    if namespace:
        query_params["namespace"] = namespace

    results = index.query(**query_params)

    # Format kết quả
    context_list = []
    for match in results.matches:
        context_list.append({
            "text": match.metadata.get("text", ""),
            "score": round(match.score, 4),
            "source": match.metadata.get("source", "unknown"),
            "namespace": match.metadata.get("namespace", "")
        })

    return context_list


# ══════════════════════════════════════════════════════════
# 7. CLI — chạy từ terminal
# ══════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RAG Pipeline — Dental KB")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--pdf", type=str, help="Đường dẫn đến 1 file PDF")
    group.add_argument("--dir", type=str, help="Thư mục chứa nhiều PDF")
    group.add_argument("--query", type=str, help="Test query (không upload)")
    parser.add_argument("--topk", type=int, default=3, help="Số kết quả trả về khi query")

    args = parser.parse_args()

    # Kết nối Pinecone
    index = get_pinecone_index()

    if args.pdf:
        result = process_pdf(args.pdf, index)
        print(f"\n✅ Kết quả: {result}")

    elif args.dir:
        results = process_directory(args.dir, index)
        print(f"\n✅ Tổng kết:")
        for r in results:
            print(f"  {r['filename']}: {r['status']} ({r.get('chunk_count', 0)} chunks)")

    elif args.query:
        print(f"\n🔍 Query: {args.query}")
        results = query_knowledge_base(args.query, index, top_k=args.topk)
        print(f"\nTop {args.topk} kết quả:")
        for i, r in enumerate(results, 1):
            print(f"\n[{i}] Score: {r['score']} | Source: {r['source']}")
            print(f"    {r['text'][:200]}...")