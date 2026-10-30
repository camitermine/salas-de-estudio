from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings


@lru_cache
def _modelo() -> SentenceTransformer:
    # Se carga una sola vez (tarda unos segundos y ocupa ~500 MB de RAM).
    # La primera vez se descarga de Hugging Face.
    return SentenceTransformer(settings.embeddings_modelo)


# Los modelos e5 se entrenaron con prefijos: "passage: " para el texto que se
# guarda y "query: " para la pregunta. Sin ellos la búsqueda empeora bastante.

def embeber_fragmentos(textos: list[str]) -> np.ndarray:
    return _modelo().encode(
        [f"passage: {t}" for t in textos],
        normalize_embeddings=True,  # vectores de largo 1: coseno y producto escalar coinciden
        batch_size=32,
    )


def embeber_pregunta(texto: str) -> np.ndarray:
    return _modelo().encode(f"query: {texto}", normalize_embeddings=True)
