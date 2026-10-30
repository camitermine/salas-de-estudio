import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import documentos, salas
from app.config import settings

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


@app.get("/salud")
def salud():
    return {"estado": "ok", "llm": settings.llm_proveedor}
