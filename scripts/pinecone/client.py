"""Single Pinecone integration module.
All SDK calls in this project flow through here.
"""
from typing import List, Tuple

from pinecone import Pinecone, ServerlessSpec

from .settings import settings

# Process-wide singleton client
_pc = Pinecone(api_key=settings.pinecone_api_key)


def ensure_index() -> str:
    """Create the configured index if it doesn't exist. Returns the index name."""
    index_name = settings.pinecone_index_name
    dim = settings.pinecone_index_dim

    existing = [idx.name for idx in _pc.list_indexes()]
    if index_name not in existing:
        _pc.create_index(
            name=index_name,
            dimension=dim,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=settings.pinecone_cloud,
                region=settings.pinecone_region,
            ),
        )

    return index_name


def smoke_test() -> dict:
    """Prove end-to-end connectivity: ensure index → describe stats."""
    index_name = ensure_index()
    index = _pc.Index(index_name)
    stats = index.describe_index_stats()

    return {
        "ok": True,
        "index_name": index_name,
        "dimension": settings.pinecone_index_dim,
        "total_vector_count": stats.total_vector_count,
        "namespaces": list(stats.namespaces.keys()) if stats.namespaces else [],
    }


def list_indexes() -> List[str]:
    """Return names of all indexes in this project."""
    return [idx.name for idx in _pc.list_indexes()]


def upsert_vectors(
    vectors: List[Tuple[str, List[float]]], namespace: str = ""
) -> dict:
    """Upsert a list of (id, vector) tuples into the configured index."""
    index_name = ensure_index()
    index = _pc.Index(index_name)
    result = index.upsert(vectors=vectors, namespace=namespace)
    return {"upserted_count": result.upserted_count}


def query_vectors(
    vector: List[float],
    top_k: int = 5,
    namespace: str = "",
    include_metadata: bool = True,
) -> dict:
    """Query the configured index. Returns matches as a list of dicts."""
    index_name = ensure_index()
    index = _pc.Index(index_name)
    result = index.query(
        vector=vector,
        top_k=top_k,
        namespace=namespace,
        include_metadata=include_metadata,
    )
    return {
        "matches": [
            {"id": m.id, "score": m.score, "metadata": m.metadata or {}}
            for m in result.matches
        ]
    }
