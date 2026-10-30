import shutil

from fastapi import APIRouter, HTTPException, Query

from app.api.esquemas import ResultadoBusqueda, Sala, SalaNueva
from app.config import settings
from app.db.conexion import conexion
from app.rag.busqueda import buscar

router = APIRouter(prefix="/salas", tags=["salas"])

_SELECT_SALA = """
    SELECT s.*, COUNT(d.id) AS documentos
    FROM salas s LEFT JOIN documentos d ON d.sala_id = s.id
"""


@router.post("", response_model=Sala, status_code=201)
def crear_sala(sala: SalaNueva):
    with conexion() as conn:
        fila = conn.execute(
            "INSERT INTO salas (nombre, descripcion) VALUES (%s, %s) RETURNING *, 0 AS documentos",
            (sala.nombre, sala.descripcion),
        ).fetchone()
    return fila


@router.get("", response_model=list[Sala])
def listar_salas():
    with conexion() as conn:
        return conn.execute(_SELECT_SALA + " GROUP BY s.id ORDER BY s.creada_en").fetchall()


@router.get("/{sala_id}", response_model=Sala)
def obtener_sala(sala_id: int):
    return _sala_o_404(sala_id)


@router.delete("/{sala_id}", status_code=204)
def borrar_sala(sala_id: int):
    _sala_o_404(sala_id)
    with conexion() as conn:
        conn.execute("DELETE FROM salas WHERE id = %s", (sala_id,))  # CASCADE borra documentos y fragmentos
    shutil.rmtree(settings.carpeta_uploads / str(sala_id), ignore_errors=True)


@router.get("/{sala_id}/buscar", response_model=list[ResultadoBusqueda])
def buscar_en_sala(sala_id: int, q: str = Query(min_length=1), k: int = Query(5, ge=1, le=20)):
    """Muestra qué fragmentos recupera la búsqueda, sin pasar por el LLM.

    Sirve para entender y depurar la parte de "retrieval" del RAG.
    """
    _sala_o_404(sala_id)
    return buscar(sala_id, q, k)


def _sala_o_404(sala_id: int) -> dict:
    with conexion() as conn:
        fila = conn.execute(_SELECT_SALA + " WHERE s.id = %s GROUP BY s.id", (sala_id,)).fetchone()
    if not fila:
        raise HTTPException(404, "La sala no existe")
    return fila
