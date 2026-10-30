import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.api.esquemas import Documento
from app.config import settings
from app.db.conexion import conexion
from app.rag.ingesta import ingerir_documento

router = APIRouter(tags=["documentos"])

MAXIMO_MB = 50

_SELECT_DOCUMENTO = """
    SELECT d.*, COUNT(f.id) AS fragmentos
    FROM documentos d LEFT JOIN fragmentos f ON f.documento_id = d.id
"""


@router.post("/salas/{sala_id}/documentos", response_model=Documento, status_code=202)
async def subir_documento(sala_id: int, archivo: UploadFile, tareas: BackgroundTasks):
    """Guarda el PDF y lo procesa en segundo plano.

    Responde enseguida con estado 'procesando'; consultar el documento
    para saber cuándo pasa a 'listo'.
    """
    with conexion() as conn:
        if not conn.execute("SELECT 1 FROM salas WHERE id = %s", (sala_id,)).fetchone():
            raise HTTPException(404, "La sala no existe")

    contenido = await archivo.read()
    if not contenido.startswith(b"%PDF"):
        raise HTTPException(400, "El archivo no es un PDF")
    if len(contenido) > MAXIMO_MB * 1024 * 1024:
        raise HTTPException(400, f"El PDF supera los {MAXIMO_MB} MB")

    # En disco se guarda con un nombre único; el nombre original queda en la base.
    carpeta = settings.carpeta_uploads / str(sala_id)
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"{uuid.uuid4().hex}.pdf"
    ruta.write_bytes(contenido)

    with conexion() as conn:
        doc = conn.execute(
            """INSERT INTO documentos (sala_id, nombre, ruta, tamano_bytes) VALUES (%s, %s, %s, %s)
               RETURNING *, 0 AS fragmentos""",
            (sala_id, archivo.filename or "documento.pdf", str(ruta), len(contenido)),
        ).fetchone()

    tareas.add_task(ingerir_documento, doc["id"])
    return doc


@router.get("/salas/{sala_id}/documentos", response_model=list[Documento])
def listar_documentos(sala_id: int):
    with conexion() as conn:
        return conn.execute(
            _SELECT_DOCUMENTO + " WHERE d.sala_id = %s GROUP BY d.id ORDER BY d.subido_en",
            (sala_id,),
        ).fetchall()


@router.get("/documentos/{documento_id}", response_model=Documento)
def obtener_documento(documento_id: int):
    return _documento_o_404(documento_id)


@router.get("/documentos/{documento_id}/archivo")
def descargar_documento(documento_id: int):
    """El PDF original, para abrirlo en el navegador en la página citada (#page=N)."""
    doc = _documento_o_404(documento_id)
    return FileResponse(
        doc["ruta"],
        media_type="application/pdf",
        filename=doc["nombre"],
        content_disposition_type="inline",  # que el navegador lo muestre en vez de descargarlo
    )


@router.delete("/documentos/{documento_id}", status_code=204)
def borrar_documento(documento_id: int):
    doc = _documento_o_404(documento_id)
    with conexion() as conn:
        conn.execute("DELETE FROM documentos WHERE id = %s", (documento_id,))
    Path(doc["ruta"]).unlink(missing_ok=True)


def _documento_o_404(documento_id: int) -> dict:
    with conexion() as conn:
        fila = conn.execute(
            _SELECT_DOCUMENTO + " WHERE d.id = %s GROUP BY d.id", (documento_id,)
        ).fetchone()
    if not fila:
        raise HTTPException(404, "El documento no existe")
    return fila
