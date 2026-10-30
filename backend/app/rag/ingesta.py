import logging
from pathlib import Path

from app.db.conexion import conexion
from app.rag.chunking import partir_en_fragmentos
from app.rag.embeddings import embeber_fragmentos
from app.rag.pdf import extraer_paginas

log = logging.getLogger(__name__)


def ingerir_documento(documento_id: int) -> None:
    """PDF → páginas → fragmentos → embeddings → tabla `fragmentos`.

    Corre en segundo plano después de la subida; el estado del documento
    pasa de 'procesando' a 'listo' o 'error'.
    """
    with conexion() as conn:
        doc = conn.execute(
            "SELECT id, sala_id, ruta FROM documentos WHERE id = %s", (documento_id,)
        ).fetchone()

    try:
        paginas = extraer_paginas(Path(doc["ruta"]))

        filas = []  # (pagina, orden, texto)
        for pagina in paginas:
            for texto in partir_en_fragmentos(pagina.texto):
                filas.append((pagina.numero, len(filas), texto))

        if not filas:
            raise ValueError("El PDF no tiene texto para leer. Si es un escaneo, todavía no se soporta.")

        vectores = embeber_fragmentos([texto for _, _, texto in filas])

        with conexion() as conn:
            with conn.cursor() as cur:
                cur.executemany(
                    """INSERT INTO fragmentos
                       (documento_id, sala_id, pagina, orden, texto, embedding)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    [
                        (doc["id"], doc["sala_id"], pagina, orden, texto, vector)
                        for (pagina, orden, texto), vector in zip(filas, vectores)
                    ],
                )
            conn.execute(
                "UPDATE documentos SET estado = 'listo', paginas = %s WHERE id = %s",
                (len(paginas), doc["id"]),
            )
        log.info("Documento %s: %s fragmentos", doc["id"], len(filas))

    except Exception as e:
        log.exception("Falló la ingesta del documento %s", documento_id)
        with conexion() as conn:
            conn.execute(
                "UPDATE documentos SET estado = 'error', error = %s WHERE id = %s",
                (str(e), documento_id),
            )
