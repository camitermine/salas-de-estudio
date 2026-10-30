from dataclasses import dataclass
from typing import Protocol


@dataclass
class Mensaje:
    rol: str  # "usuario" | "asistente"
    contenido: str


@dataclass
class RespuestaLLM:
    texto: str
    modelo: str  # qué modelo respondió, para mostrarlo y guardarlo


class ErrorLLM(Exception):
    """Falla del proveedor, con un mensaje que se puede mostrar en la UI.

    `definitivo=True` significa que no tiene sentido volver a intentar con
    ese proveedor mientras el servidor siga corriendo (sin créditos, key
    inválida): la cadena lo saltea directamente en los pedidos siguientes.
    """

    def __init__(self, mensaje: str, definitivo: bool = False):
        super().__init__(mensaje)
        self.definitivo = definitivo


class ProveedorLLM(Protocol):
    """Interfaz común para Claude, Gemini y Ollama.

    El resto del backend solo conoce esta interfaz; qué proveedores se usan
    y en qué orden se elige con LLM_PROVEEDORES en el .env.
    """

    nombre: str

    def responder(self, sistema: str, historial: list[Mensaje]) -> RespuestaLLM: ...
