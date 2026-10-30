import logging
from functools import lru_cache

from app.config import settings
from app.llm.base import ErrorLLM, Mensaje, ProveedorLLM, RespuestaLLM
from app.llm.cadena import Cadena

__all__ = ["ErrorLLM", "Mensaje", "ProveedorLLM", "RespuestaLLM", "obtener_llm"]

log = logging.getLogger(__name__)


def _crear(nombre: str) -> ProveedorLLM:
    if nombre == "claude":
        from app.llm.claude import Claude

        return Claude(settings.anthropic_api_key, settings.claude_modelo, settings.claude_esfuerzo)
    if nombre == "gemini":
        from app.llm.gemini import Gemini

        return Gemini(settings.gemini_api_key, settings.gemini_modelo, settings.gemini_razonamiento)
    raise ErrorLLM(f"El proveedor '{nombre}' no existe (opciones: claude, gemini)", definitivo=True)


@lru_cache
def obtener_llm() -> Cadena:
    """Los proveedores de LLM_PROVEEDORES, en ese orden de preferencia.

    Un proveedor mal configurado (por ejemplo, sin API key) se saltea con
    un aviso en el log en lugar de frenar todo.
    """
    proveedores = []
    for nombre in (n.strip() for n in settings.llm_proveedores.split(",") if n.strip()):
        try:
            proveedores.append(_crear(nombre))
        except ErrorLLM as e:
            log.warning("Se saltea %s: %s", nombre, e)
    return Cadena(proveedores)
