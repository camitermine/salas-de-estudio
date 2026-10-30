import anthropic

from app.llm.base import ErrorLLM, Mensaje, RespuestaLLM

_ROLES = {"usuario": "user", "asistente": "assistant"}


class Claude:
    nombre = "claude"

    def __init__(self, api_key: str, modelo: str, esfuerzo: str):
        if not api_key:
            raise ErrorLLM("Falta ANTHROPIC_API_KEY en backend/.env", definitivo=True)
        # Sin reintentos automáticos: si Claude falla, la cadena pasa enseguida
        # al siguiente proveedor en vez de esperar varios reintentos.
        self._cliente = anthropic.Anthropic(api_key=api_key, max_retries=0, timeout=60)
        self._modelo = modelo
        # Cuánto razona el modelo antes de responder. "low" alcanza para
        # responder sobre fragmentos ya recuperados y es lo más rápido y barato.
        self._esfuerzo = esfuerzo

    def responder(self, sistema: str, historial: list[Mensaje]) -> RespuestaLLM:
        try:
            respuesta = self._cliente.messages.create(
                model=self._modelo,
                max_tokens=4000,
                system=sistema,
                output_config={"effort": self._esfuerzo},
                messages=[{"role": _ROLES[m.rol], "content": m.contenido} for m in historial],
            )
        except anthropic.APIStatusError as e:
            if e.type == "billing_error" or "credit balance" in e.message.lower():
                raise ErrorLLM("Se terminaron los créditos de Claude.", definitivo=True) from e
            if isinstance(e, (anthropic.AuthenticationError, anthropic.PermissionDeniedError)):
                raise ErrorLLM("La ANTHROPIC_API_KEY no es válida.", definitivo=True) from e
            if isinstance(e, anthropic.NotFoundError):
                raise ErrorLLM(f"El modelo {self._modelo} no existe o no está disponible.", definitivo=True) from e
            if isinstance(e, anthropic.RateLimitError):
                raise ErrorLLM("Claude: demasiados pedidos seguidos.") from e
            raise ErrorLLM(f"Claude no respondió ({e.status_code}).") from e
        except anthropic.APIConnectionError as e:
            raise ErrorLLM("No se pudo conectar con Claude.") from e

        if respuesta.stop_reason == "refusal":
            raise ErrorLLM("Claude se negó a responder esta pregunta.")

        texto = "".join(b.text for b in respuesta.content if b.type == "text").strip()
        if not texto:
            raise ErrorLLM("Claude devolvió una respuesta vacía.")
        return RespuestaLLM(texto=texto, modelo=self._modelo)
