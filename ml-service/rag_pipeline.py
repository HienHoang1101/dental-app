"""
RAG pipeline for the dental knowledge base.

Responsibilities:
- Upload PDF -> split into chunks -> embed -> store in Pinecone.
- Search context -> embed query -> retrieve relevant document chunks.

This implementation uses LangChain + Gemini embeddings + Pinecone.
The Gemini embedding dimensionality is configurable so it can match the
existing Pinecone index dimension.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "dental-kb")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# models/embedding-001 is no longer available on current Gemini API accounts.
# gemini-embedding-001 supports output_dimensionality, so we set it to 768 by
# default to match the existing Pinecone index created for dental-kb.
EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")
EMBEDDING_DIMENSIONS = int(os.getenv("GEMINI_EMBEDDING_DIMENSIONS", "768"))

CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "100"))
MAX_PAGES = int(os.getenv("RAG_MAX_PAGES", "0"))

_embeddings = None
_pinecone_client = None
_pinecone_index = None


def _require_dependencies() -> None:
    missing = []
    try:
        import langchain  # noqa: F401
    except ImportError:
        missing.append("langchain")
    try:
        import langchain_community  # noqa: F401
    except ImportError:
        missing.append("langchain-community")
    try:
        import langchain_google_genai  # noqa: F401
    except ImportError:
        missing.append("langchain-google-genai")
    try:
        import langchain_pinecone  # noqa: F401
    except ImportError:
        missing.append("langchain-pinecone")

    if missing:
        raise RuntimeError(
            "Missing RAG dependencies. Install: pip install " + " ".join(missing)
        )


def _sanitize_namespace(value: str) -> str:
    namespace = Path(value).stem.lower()
    namespace = re.sub(r"[^a-z0-9_]+", "_", namespace)
    namespace = namespace.strip("_")
    return namespace or "document"


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _require_dependencies()
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")

        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        kwargs: dict[str, Any] = {
            "model": EMBEDDING_MODEL,
            "google_api_key": GEMINI_API_KEY,
        }
        if EMBEDDING_DIMENSIONS > 0:
            kwargs["output_dimensionality"] = EMBEDDING_DIMENSIONS

        _embeddings = GoogleGenerativeAIEmbeddings(**kwargs)
    return _embeddings


def get_pinecone_client():
    global _pinecone_client
    if _pinecone_client is None:
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY is not set")

        from pinecone import Pinecone

        _pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
    return _pinecone_client


def get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        _pinecone_index = get_pinecone_client().Index(PINECONE_INDEX)
    return _pinecone_index


def get_vectorstore(namespace: str | None = None):
    _require_dependencies()
    from langchain_pinecone import PineconeVectorStore

    return PineconeVectorStore(
        index_name=PINECONE_INDEX,
        embedding=get_embeddings(),
        namespace=namespace,
    )


def upload_pdf(file_path: str, namespace: str) -> dict[str, Any]:
    """
    Read a PDF, split it into chunks, embed chunks, and store vectors in Pinecone.

    Args:
        file_path: PDF path.
        namespace: Pinecone namespace, usually file stem or document id.

    Returns:
        {"namespace": "...", "chunk_count": 42, "status": "completed"}
    """
    _require_dependencies()
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_pinecone import PineconeVectorStore
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:
        from langchain.text_splitter import RecursiveCharacterTextSplitter

    pdf_path = Path(file_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    namespace = _sanitize_namespace(namespace)

    loader = PyPDFLoader(str(pdf_path))
    pages = loader.load()
    if MAX_PAGES > 0:
        pages = pages[:MAX_PAGES]

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(pages)

    for index, doc in enumerate(chunks):
        doc.metadata.update(
            {
                "source": pdf_path.name,
                "namespace": namespace,
                "chunk_index": index,
                # Keep compatibility with older code that reads metadata["text"].
                "text": doc.page_content,
            }
        )

    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        index_name=PINECONE_INDEX,
        namespace=namespace,
    )

    return {
        "namespace": namespace,
        "chunk_count": len(chunks),
        "status": "completed",
    }


def search_context(query: str, namespace: str | None = None, top_k: int = 5) -> list[str]:
    """
    Retrieve the most relevant context chunks from Pinecone.

    Args:
        query: Patient question or diagnosis query.
        namespace: Optional namespace. If None, search the default namespace.
        top_k: Number of chunks to return.

    Returns:
        List of context strings.
    """
    if not query.strip():
        return []

    vectorstore = get_vectorstore(namespace=namespace)
    results = vectorstore.similarity_search(query, k=top_k)
    return [doc.page_content for doc in results]


def search_context_for_diagnosis(
    symptoms: list[str],
    disease_name: str | None = None,
    top_k: int = 5,
    namespace: str | None = None,
) -> list[str]:
    """
    Search context using both detected symptoms and the suspected disease name.
    """
    query_parts = []
    if disease_name:
        query_parts.append(disease_name)
    query_parts.extend(symptoms)
    query = " ".join(part for part in query_parts if part)
    return search_context(query, namespace=namespace, top_k=top_k)


def delete_document(namespace: str) -> dict[str, str]:
    """Delete all vectors of a document namespace from Pinecone."""
    namespace = _sanitize_namespace(namespace)
    get_pinecone_index().delete(delete_all=True, namespace=namespace)
    return {"namespace": namespace, "status": "deleted"}


def list_namespaces() -> list[str]:
    """List document namespaces currently present in the Pinecone index."""
    stats = get_pinecone_index().describe_index_stats()
    namespaces = stats.get("namespaces", {})
    return sorted(namespaces.keys())


def process_pdf(pdf_path: str, index=None) -> dict[str, Any]:
    """
    Compatibility wrapper for the existing FastAPI /embed endpoint.

    The old function accepted a Pinecone index object. LangChain manages the
    index internally, so the argument is ignored.
    """
    namespace = _sanitize_namespace(Path(pdf_path).stem)
    return upload_pdf(pdf_path, namespace=namespace)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload/search dental PDF RAG context")
    parser.add_argument("--pdf", help="PDF file to upload")
    parser.add_argument("--namespace", help="Pinecone namespace. Defaults to PDF filename")
    parser.add_argument("--query", help="Query text for context search")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--list", action="store_true", help="List namespaces")
    parser.add_argument("--delete", help="Delete a namespace")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.list:
        print(list_namespaces())
        return

    if args.delete:
        print(delete_document(args.delete))
        return

    if args.pdf:
        namespace = args.namespace or Path(args.pdf).stem
        print(upload_pdf(args.pdf, namespace=namespace))
        return

    if args.query:
        contexts = search_context(args.query, namespace=args.namespace, top_k=args.top_k)
        for index, context in enumerate(contexts, start=1):
            print(f"\n--- Context {index} ---")
            print(context)
        return

    raise SystemExit("Provide --pdf, --query, --list, or --delete")


if __name__ == "__main__":
    main()
