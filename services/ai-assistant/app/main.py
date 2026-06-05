from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import numpy as np
from typing import Optional
import os
import json

app = FastAPI(title="SuqAI Semantic Assistant")

class ChatRequest(BaseModel):
    message: str
    city_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    intent: str = "general"
    suggestions: list[str] = []

class IndexRequest(BaseModel):
    documents: list[dict]  # [{id, text, sector, merchant, city}]

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class SearchResponse(BaseModel):
    results: list[dict]

model: Optional[SentenceTransformer] = None
document_embeddings: Optional[np.ndarray] = None
documents: list[dict] = []

def get_model():
    global model
    if model is None:
        model_name = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-small")
        model = SentenceTransformer(model_name)
    return model

@app.on_event("startup")
async def startup():
    get_model()

@app.post("/index", response_model=dict)
async def index_documents(req: IndexRequest):
    global document_embeddings, documents
    documents = req.documents
    if not documents:
        return {"indexed": 0}
    texts = [f"passage: {d.get('text', '')}" for d in documents]
    model = get_model()
    document_embeddings = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
    return {"indexed": len(documents)}

@app.post("/semantic-search", response_model=SearchResponse)
async def semantic_search(req: SearchRequest):
    global document_embeddings, documents
    if document_embeddings is None or not documents:
        return SearchResponse(results=[])
    model = get_model()
    query_emb = model.encode(f"query: {req.query}", convert_to_tensor=True)
    scores = util.cos_sim(query_emb, document_embeddings)[0]
    top_indices = scores.topk(min(req.top_k, len(documents))).indices.tolist()
    results = []
    for idx in top_indices:
        doc = documents[idx]
        doc["score"] = float(scores[idx])
        results.append(doc)
    results.sort(key=lambda x: x["score"], reverse=True)
    return SearchResponse(results=results)

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    text = req.message.strip()
    if not text:
        return ChatResponse(response="مرحباً! كيف يمكنني مساعدتك؟")

    greetings = ["مرحبا", "السلام", "hi", "hello", "اهلا"]
    if any(g in text for g in greetings):
        return ChatResponse(
            response="مرحباً بك في سوقي! أنا مساعدك الذكي.\nيمكنني مساعدتك في إيجاد التجار والمنتجات والخدمات.\nأخبرني ما الذي تبحث عنه.",
            intent="greeting",
        )

    global document_embeddings, documents
    if document_embeddings is not None and documents:
        model = get_model()
        query_emb = model.encode(f"query: {text}", convert_to_tensor=True)
        scores = util.cos_sim(query_emb, document_embeddings)[0]
        top_idx = scores.topk(3).indices.tolist()
        best = None
        city_filtered = []
        for idx in top_idx:
            doc = documents[idx]
            score = float(scores[idx])
            if score < 0.3:
                continue
            if req.city_id and doc.get("city_id") and doc["city_id"] != req.city_id:
                city_filtered.append(doc)
                continue
            if best is None or score > best["score"]:
                best = {**doc, "score": score}
        if best:
            lines = [f"وجدت {best.get('sector', '')} - {best.get('merchant', '')}"]
            lines.append(best.get("text", ""))
            suggestions = [doc.get("text", "") for doc in city_filtered[:2]] if city_filtered else []
            return ChatResponse(
                response="\n".join(lines),
                intent="found",
                suggestions=suggestions,
            )
        if city_filtered:
            return ChatResponse(
                response=f"لم أجد نتائج في مدينتك، لكن توجد نتائج في مدن أخرى:\n{city_filtered[0].get('text', '')}",
                intent="other_city",
            )

    return ChatResponse(
        response="عذراً، لم أتمكن من العثور على نتائج. جرب البحث بكلمات مختلفة.",
        intent="not_found",
    )

@app.get("/health")
async def health():
    model_loaded = model is not None
    docs_count = len(documents)
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "documents_indexed": docs_count,
    }
