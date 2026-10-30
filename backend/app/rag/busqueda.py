from dataclasses import dataclass

from app.db.conexion import conexion
from app.rag.embeddings import embeber_pregunta


@dataclass
class Resultado:
    fragmento_id: int
    documento_id: int
    documento: str
    pagina: int
    texto: str
    similitud: float  # cuanto más cerca de 1, más parecido en significado


def buscar(sala_id: int, pregunta: str, k: int = 5) -> list[Resultado]:
    """Los `k` fragmentos de la sala más parecidos en significado a la pregunta."""
    vector = embeber_pregunta(pregunta)
    with conexion() as conn:
        filas = conn.execute(
            """SELECT f.id, f.documento_id, d.nombre, f.pagina, f.texto,
                      1 - (f.embedding <=> %(v)s) AS similitud
               FROM fragmentos f
               JOIN documentos d ON d.id = f.documento_id
               WHERE f.sala_id = %(sala)s
               ORDER BY f.embedding <=> %(v)s
               LIMIT %(k)s""",
            {"v": vector, "sala": sala_id, "k": k},
        ).fetchall()
    return [
        Resultado(
            fragmento_id=f["id"],
            documento_id=f["documento_id"],
            documento=f["nombre"],
            pagina=f["pagina"],
            texto=f["texto"],
            similitud=round(float(f["similitud"]), 3),
        )
        for f in filas
    ]
