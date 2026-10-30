from dataclasses import dataclass

from psycopg.types.json import Jsonb

from app.db.conexion import conexion
from app.llm import Mensaje, obtener_llm
from app.rag.busqueda import buscar
from app.rag.prompt import SISTEMA, armar_mensaje, extraer_fuentes

# Cuántos fragmentos se le pasan al LLM. Más fragmentos = más chances de que
# esté la respuesta, pero también más ruido y más tokens.
FRAGMENTOS_POR_PREGUNTA = 5

# Cuántos mensajes previos se mandan como historial (6 = 3 idas y vueltas).
MENSAJES_DE_HISTORIAL = 6


@dataclass
class Respuesta:
    respuesta: str
    fuentes: list[dict]
    modelo: str


def responder(sala_id: int, pregunta: str) -> Respuesta:
    """Retrieval → prompt con fragmentos → LLM → respuesta con fuentes.

    La búsqueda usa solo la pregunta actual. Una repregunta como "¿y eso para
    qué sirve?" puede recuperar mal; mejorarlo (reescribir la pregunta con el
    historial) queda para la etapa de calidad.
    """
    fragmentos = buscar(sala_id, pregunta, k=FRAGMENTOS_POR_PREGUNTA)

    with conexion() as conn:
        previos = conn.execute(
            """SELECT rol, contenido FROM mensajes WHERE sala_id = %s
               ORDER BY creado_en DESC, id DESC LIMIT %s""",
            (sala_id, MENSAJES_DE_HISTORIAL),
        ).fetchall()
    historial = [Mensaje(m["rol"], m["contenido"]) for m in reversed(previos)]
    historial.append(Mensaje("usuario", armar_mensaje(pregunta, fragmentos)))

    llm = obtener_llm().responder(SISTEMA, historial)
    fuentes = extraer_fuentes(llm.texto, fragmentos)

    # Se guarda la pregunta sola (sin los fragmentos) y la respuesta con sus fuentes.
    with conexion() as conn:
        conn.execute(
            "INSERT INTO mensajes (sala_id, rol, contenido) VALUES (%s, 'usuario', %s)",
            (sala_id, pregunta),
        )
        conn.execute(
            """INSERT INTO mensajes (sala_id, rol, contenido, fuentes, modelo)
               VALUES (%s, 'asistente', %s, %s, %s)""",
            (sala_id, llm.texto, Jsonb(fuentes), llm.modelo),
        )
    return Respuesta(llm.texto, fuentes, llm.modelo)
