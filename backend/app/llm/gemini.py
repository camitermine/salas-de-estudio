from google import genai
from google.genai import errors, types

from app.llm.base import ErrorLLM, Mensaje, RespuestaLLM

_ROLES = {"usuario": "user", "asistente": "model"}


class Gemini:
    nombre = "gemini"

    def __init__(self, api_key: str, modelo: str, razonamiento: str):
        if not api_key:
            raise ErrorLLM("Falta GEMINI_API_KEY en backend/.env", definitivo=True)
        self._cliente = genai.Client(api_key=api_key)
        self._modelo = modelo
        # Cuánto "piensa" el modelo antes de responder. Para responder sobre
        # fragmentos ya recuperados alcanza con poco, y baja mucho la demora
        # (en las pruebas: ~5 s con LOW contra 25-120 s con el valor por defecto).
        self._razonamiento = types.ThinkingConfig(thinking_level=razonamiento.upper())

    def responder(self, sistema: str, historial: list[Mensaje]) -> RespuestaLLM:
        try:
            respuesta = self._cliente.models.generate_content(
                model=self._modelo,
                contents=[
                    types.Content(role=_ROLES[m.rol], parts=[types.Part(text=m.contenido)])
                    for m in historial
                ],
                config=types.GenerateContentConfig(
                    system_instruction=sistema,
                    # Baja: queremos que se apegue a los apuntes, no que sea creativo.
                    temperature=0.2,
                    thinking_config=self._razonamiento,
                ),
            )
        except errors.ClientError as e:
            if e.code == 429:
                raise ErrorLLM("Se alcanzó el límite del plan gratuito de Gemini. Probá de nuevo en un minuto.") from e
            raise ErrorLLM(f"Gemini rechazó el pedido: {e.message}") from e
        except errors.ServerError as e:
            raise ErrorLLM("Gemini no está disponible en este momento. Probá de nuevo en un rato.") from e

        if not respuesta.text:
            raise ErrorLLM("Gemini devolvió una respuesta vacía.")
        return RespuestaLLM(texto=respuesta.text, modelo=self._modelo)
