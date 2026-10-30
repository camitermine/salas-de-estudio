import pytest

from app.llm.base import ErrorLLM, Mensaje, RespuestaLLM
from app.llm.cadena import Cadena

HISTORIAL = [Mensaje("usuario", "hola")]


class Falso:
    def __init__(self, nombre: str, error: ErrorLLM | None = None):
        self.nombre = nombre
        self.error = error
        self.llamadas = 0

    def responder(self, sistema, historial):
        self.llamadas += 1
        if self.error:
            raise self.error
        return RespuestaLLM(texto=f"respuesta de {self.nombre}", modelo=self.nombre)


def test_usa_el_primero_si_responde():
    claude, gemini = Falso("claude"), Falso("gemini")
    assert Cadena([claude, gemini]).responder("", HISTORIAL).modelo == "claude"
    assert gemini.llamadas == 0


def test_pasa_al_siguiente_si_el_primero_falla():
    claude = Falso("claude", ErrorLLM("sobrecargado"))
    cadena = Cadena([claude, Falso("gemini")])
    assert cadena.responder("", HISTORIAL).modelo == "gemini"
    # Un error pasajero no lo descarta: el próximo pedido lo vuelve a intentar.
    cadena.responder("", HISTORIAL)
    assert claude.llamadas == 2


def test_sin_creditos_lo_saltea_en_los_pedidos_siguientes():
    claude = Falso("claude", ErrorLLM("sin créditos", definitivo=True))
    cadena = Cadena([claude, Falso("gemini")])
    cadena.responder("", HISTORIAL)
    cadena.responder("", HISTORIAL)
    assert claude.llamadas == 1
    assert cadena.disponibles() == ["gemini"]


def test_si_fallan_todos_junta_los_errores():
    cadena = Cadena([Falso("claude", ErrorLLM("A.")), Falso("gemini", ErrorLLM("B."))])
    with pytest.raises(ErrorLLM, match="A. B."):
        cadena.responder("", HISTORIAL)
