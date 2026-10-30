from fastapi import FastAPI

from app.config import settings

app = FastAPI(title="Salas de Estudio")


@app.get("/salud")
def salud():
    return {"estado": "ok", "llm": settings.llm_proveedor}
