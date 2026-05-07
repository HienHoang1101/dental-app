"""
Test full chat pipeline với Gemini thật.
Tiết kiệm quota: 2 câu hỏi × 2 mode = 4 calls, sleep 15s giữa mỗi call.
"""
from main import chat_endpoint, ChatRequest
import time

TEST_QUESTIONS = [
    {
        "q": "Răng tôi bị ê buốt khi uống nước lạnh, em phải làm sao?",
        "expected_label": "e_buot",
    },
    {
        "q": "Em muốn niềng răng, mất bao lâu và giá khoảng bao nhiêu?",
        "expected_label": "chinh_nha",
    },
]


def run_test(question: str, use_rag: bool):
    start = time.time()
    req = ChatRequest(text=question, use_rag=use_rag)
    res = chat_endpoint(req)
    elapsed = time.time() - start
    return res, elapsed


def print_result(label_str, res, elapsed):
    print(f"\n--- {label_str} ({elapsed:.2f}s) ---")
    print(f"ML label: {res.ml_result.label} ({res.ml_result.confidence})")
    print(f"Context chunks: {res.context_count}")
    print(f"Answer:\n{res.answer}")


for i, item in enumerate(TEST_QUESTIONS, 1):
    print(f"\n{'='*70}")
    print(f"[{i}/{len(TEST_QUESTIONS)}] Q: {item['q']}")
    print(f"Expected label: {item['expected_label']}")
    print(f"{'='*70}")

    # Test với RAG
    res_rag, t_rag = run_test(item["q"], use_rag=True)
    print_result("WITH RAG", res_rag, t_rag)
    print("\n[Sleeping 15s to respect Gemini quota...]")
    time.sleep(15)

    # Test không RAG
    res_norag, t_norag = run_test(item["q"], use_rag=False)
    print_result("WITHOUT RAG", res_norag, t_norag)

    # Ngắn gọn so sánh
    print(f"\nCompare: ML={'✓' if res_rag.ml_result.label == item['expected_label'] else '✗'} "
          f"| Latency RAG={t_rag:.2f}s vs No-RAG={t_norag:.2f}s "
          f"| Chunks retrieved={res_rag.context_count}")

    if i < len(TEST_QUESTIONS):
        print("\n[Sleeping 15s before next question...]")
        time.sleep(15)

