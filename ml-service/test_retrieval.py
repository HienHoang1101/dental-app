from main import get_pinecone_index, _embed_model, retrieve_context

# Test 1: dùng luôn function retrieve_context có sẵn (đúng cách production)
print("=== TEST 1: retrieve_context() ===\n")
chunks = retrieve_context(
    question="Răng tôi bị ê buốt khi uống nước lạnh",
    _label="e_buot",
    top_k=3
)
print(f"Got {len(chunks)} chunks\n")
for i, c in enumerate(chunks):
    print(f"[{i+1}] score={c['score']} source={c['source']}")
    print(f"    {c['text'][:300]}")
    print()

# Test 2: query thô để xem score distribution
print("\n=== TEST 2: raw query, no threshold ===\n")
idx = get_pinecone_index()
vec = _embed_model.encode("Răng ê buốt khi uống nước lạnh", normalize_embeddings=True).tolist()

for ns in ["phac_do_dieu_tri_bv_rhm_2023", "quytrinhchuyenmonbvrhm", "rang_ham_mat"]:
    try:
        res = idx.query(vector=vec, top_k=2, include_metadata=True, namespace=ns)
        print(f"Namespace: {ns}")
        for m in res.matches:
            text_preview = m.metadata.get("text", "")[:150]
            print(f"  score={m.score:.4f}  text={text_preview}")
    except Exception as e:
        print(f"Namespace: {ns}  --> ERROR: {e}")
    print()

