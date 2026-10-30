from fastapi import APIRouter, HTTPException

from app.api.esquemas import MensajeChat, PreguntaChat, RespuestaChat
from app.db.conexion import conexion
from app.llm import ErrorLLM
from app.rag.chat import responder

router = APIRouter(prefix="/salas/{sala_id}", tags=["chat"])


@router.post("/chat", response_model=RespuestaChat)
def preguntar(sala_id: int, cuerpo: PreguntaChat):
    _verificar_sala(sala_id)
    try:
        r = responder(sala_id, cuerpo.pregunta)
    except ErrorLLM as e:
        raise HTTPException(503, str(e)) from e
    return RespuestaChat(respuesta=r.respuesta, fuentes=r.fuentes, modelo=r.modelo)


@router.get("/mensajes", response_model=list[MensajeChat])
def historial(sala_id: int):
    _verificar_sala(sala_id)
    with conexion() as conn:
        return conn.execute(
            "SELECT * FROM mensajes WHERE sala_id = %s ORDER BY creado_en, id", (sala_id,)
        ).fetchall()


@router.delete("/mensajes", status_code=204)
def borrar_historial(sala_id: int):
    """Empieza una conversación nueva en la sala (los apuntes no se tocan)."""
    _verificar_sala(sala_id)
    with conexion() as conn:
        conn.execute("DELETE FROM mensajes WHERE sala_id = %s", (sala_id,))


def _verificar_sala(sala_id: int) -> None:
    with conexion() as conn:
        if not conn.execute("SELECT 1 FROM salas WHERE id = %s", (sala_id,)).fetchone():
            raise HTTPException(404, "La sala no existe")
