import logging

from app.llm.base import ErrorLLM, Mensaje, ProveedorLLM, RespuestaLLM

log = logging.getLogger(__name__)


class Cadena:
    """Prueba los proveedores en orden y usa el primero que responda.

    Ejemplo: Claude primero (mientras haya créditos) y Gemini de respaldo.
    Si un proveedor falla de forma definitiva (sin créditos, key inválida),
    se lo saltea en los pedidos siguientes hasta reiniciar el servidor.
    """

    nombre = "cadena"

    def __init__(self, proveedores: list[ProveedorLLM]):
        self._proveedores = proveedores
        self._descartados: set[str] = set()

    def responder(self, sistema: str, historial: list[Mensaje]) -> RespuestaLLM:
        errores = []
        for proveedor in self._proveedores:
            if proveedor.nombre in self._descartados:
                continue
            try:
                return proveedor.responder(sistema, historial)
            except ErrorLLM as e:
                log.warning("%s falló: %s", proveedor.nombre, e)
                errores.append(str(e))
                if e.definitivo:
                    self._descartados.add(proveedor.nombre)
        raise ErrorLLM(" ".join(errores) or "No hay ningún proveedor de LLM disponible.")

    def disponibles(self) -> list[str]:
        return [p.nombre for p in self._proveedores if p.nombre not in self._descartados]
