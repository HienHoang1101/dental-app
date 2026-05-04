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

from dotenv import load_dotenv
load_dotenv()

import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
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

EMBED_MODEL_NAME  = "bkai-foundation-models/vietnamese-bi-encoder"
EMBED_DIMENSION   = 768   # phải khớp với index dimension trên Pinecone

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

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Chunk đơn giản, nhanh hơn."""
    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if len(chunk) > 50:
            chunks.append(chunk)
        if end == text_len:
            break
        start = end - overlap

    print(f"  → {len(chunks)} chunks")
    return chunks


# ══════════════════════════════════════════════════════════
# 3. EMBED
# ══════════════════════════════════════════════════════════

def embed_texts(texts: list[str]) -> list[list[float]]:
    print(f"  Bắt đầu embed {len(texts)} chunks...")
    embeddings = _embed_model.encode(
        texts,
        batch_size=8,
        show_progress_bar=True,
        normalize_embeddings=True  # chuẩn hóa để cosine = dot product
    )
    print("  Embed xong!")
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


def recreate_index():
    """Xóa index cũ và tạo lại với dimension mới. Dùng khi đổi embedding model."""
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY chưa được set trong .env")

    pc = Pinecone(api_key=PINECONE_API_KEY)
    existing = [idx.name for idx in pc.list_indexes()]

    if PINECONE_INDEX in existing:
        print(f"Xóa index cũ: {PINECONE_INDEX} ...")
        pc.delete_index(PINECONE_INDEX)
        print("✅ Index cũ đã xóa")

    print(f"Tạo index mới: {PINECONE_INDEX} (dim={EMBED_DIMENSION}) ...")
    pc.create_index(
        name=PINECONE_INDEX,
        dimension=EMBED_DIMENSION,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=PINECONE_REGION)
    )
    print(f"✅ Index mới sẵn sàng")
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
    chunks = chunk_text(clean)
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


PINECONE_NAMESPACES = [
    "rang_ham_mat",
    "quytrinhchuyenmonbvrhm",
    "phac_do_dieu_tri_bv_rhm_2023",
]


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
    vector = _embed_model.encode(
        question, normalize_embeddings=True
    ).tolist()

    all_results = []
    for ns in PINECONE_NAMESPACES:
        results = index.query(
            vector=vector,
            top_k=2,
            include_metadata=True,
            namespace=ns
        )
        for match in results.matches:
            all_results.append({
                "text": match.metadata.get("text", ""),
                "score": round(match.score, 4),
                "source": match.metadata.get("source", "unknown")
            })

    all_results.sort(key=lambda x: -x["score"])
    return all_results[:top_k]


# ══════════════════════════════════════════════════════════
# 7. CLI — chạy từ terminal
# ══════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RAG Pipeline — Dental KB")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--pdf", type=str, help="Đường dẫn đến 1 file PDF")
    group.add_argument("--dir", type=str, help="Thư mục chứa nhiều PDF")
    group.add_argument("--query", type=str, help="Test query (không upload)")
    group.add_argument("--reindex", action="store_true",
                       help="Xóa index cũ, tạo lại và upload toàn bộ pdf_docs/")
    parser.add_argument("--topk", type=int, default=3, help="Số kết quả trả về khi query")

    args = parser.parse_args()

    if args.reindex:
        index = recreate_index()
        pdf_dir = str(Path(__file__).parent / "pdf_docs")
        results = process_directory(pdf_dir, index)
        print(f"\nTong ket reindex:")
        for r in results:
            print(f"  {r.get('filename', '?')}: {r['status']} ({r.get('chunk_count', 0)} chunks)")
    else:
        # Kết nối Pinecone
        index = get_pinecone_index()

        if args.pdf:
            result = process_pdf(args.pdf, index)
            print(f"\nKet qua: {result}")

        elif args.dir:
            results = process_directory(args.dir, index)
            print(f"\nTong ket:")
            for r in results:
                print(f"  {r.get('filename', '?')}: {r['status']} ({r.get('chunk_count', 0)} chunks)")

        elif args.query:
            print(f"\nQuery: {args.query}")
            results = query_knowledge_base(args.query, index, top_k=args.topk)
            print(f"\nTop {args.topk} ket qua:")
            for i, r in enumerate(results, 1):
                print(f"\n[{i}] Score: {r['score']} | Source: {r['source']}")
                print(f"    {r['text'][:200]}...")
