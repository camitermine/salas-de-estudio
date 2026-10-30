import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, documentos, salas
from app.config import settings
from app.llm import obtener_llm
from app.rag import chat as rag_chat
from app.rag import chunking

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Salas de Estudio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend de Vite en desarrollo
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(salas.router)
app.include_router(documentos.router)
app.include_router(chat.router)


@app.get("/salud")
def salud():
    return {"estado": "ok", "llm_disponibles": obtener_llm().disponibles()}


@app.get("/info")
def info():
    """Configuración real del RAG, para mostrarla en la interfaz."""
    return {
        "llm_disponibles": obtener_llm().disponibles(),
        "modelo_claude": settings.claude_modelo,
        "modelo_gemini": settings.gemini_modelo,
        "embeddings": settings.embeddings_modelo,
        "tamano_fragmento": chunking.TAMANO,
        "solapamiento": chunking.SOLAPAMIENTO,
        "fragmentos_por_pregunta": rag_chat.FRAGMENTOS_POR_PREGUNTA,
    }
