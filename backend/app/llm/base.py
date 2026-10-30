from dataclasses import dataclass
from typing import Protocol


@dataclass
class Mensaje:
    rol: str  # "usuario" | "asistente"
    contenido: str


class ProveedorLLM(Protocol):
    """Interfaz común para Ollama, Gemini y Claude.

    El resto del backend solo conoce esta interfaz; el proveedor concreto
    se elige con LLM_PROVEEDOR en el .env.
    """

    def responder(self, sistema: str, historial: list[Mensaje]) -> str: ...
