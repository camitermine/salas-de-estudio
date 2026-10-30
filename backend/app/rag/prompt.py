import re

from app.rag.busqueda import Resultado

# Las reglas van en el system prompt. Los fragmentos van en el mensaje de la
# pregunta actual: así cada turno trae su propio contexto y el historial
# guardado queda liviano (solo preguntas y respuestas).
SISTEMA = """Sos un asistente de estudio. Respondés preguntas sobre los apuntes de una materia.

Reglas:
- Usá SOLO la información de los fragmentos de apuntes que vienen con cada pregunta. No agregues conocimiento propio.
- Después de cada afirmación, citá el fragmento de donde sale con su número entre corchetes, por ejemplo [2]. Si sale de varios, [1][3].
- Si los fragmentos no alcanzan para responder, decilo claramente ("Eso no aparece en tus apuntes") y no inventes. Podés sugerir qué buscar.
- Respondé en español, claro y ordenado, como le explicarías a alguien que está estudiando para un parcial.
- Si la pregunta hace referencia a algo dicho antes en la conversación, usá el historial para entenderla, pero la respuesta tiene que salir de los fragmentos."""

_CITA = re.compile(r"\[(\d+)\]")


def armar_mensaje(pregunta: str, fragmentos: list[Resultado]) -> str:
    """Pregunta + fragmentos numerados [1]..[n] con su documento y página."""
    if not fragmentos:
        contexto = "(No hay fragmentos: la sala todavía no tiene apuntes cargados.)"
    else:
        contexto = "\n\n".join(
            f"[{i}] ({f.documento}, pág. {f.pagina})\n{f.texto}"
            for i, f in enumerate(fragmentos, start=1)
        )
    return f"Fragmentos de los apuntes:\n\n{contexto}\n\n---\nPregunta: {pregunta}"


def extraer_fuentes(respuesta: str, fragmentos: list[Resultado]) -> list[dict]:
    """Las fuentes que la respuesta citó de verdad, en orden de aparición.

    Se ignoran números que no corresponden a ningún fragmento (el modelo
    a veces inventa una cita): una cita que no existe no se muestra.
    """
    fuentes = []
    vistos = set()
    for numero in (int(n) for n in _CITA.findall(respuesta)):
        if numero in vistos or not 1 <= numero <= len(fragmentos):
            continue
        vistos.add(numero)
        f = fragmentos[numero - 1]
        fuentes.append(
            {"n": numero, "documento_id": f.documento_id, "documento": f.documento, "pagina": f.pagina}
        )
    return fuentes
