from datetime import datetime

from pydantic import BaseModel, Field


class SalaNueva(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: str | None = None


class Sala(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    creada_en: datetime
    documentos: int = 0


class Documento(BaseModel):
    id: int
    sala_id: int
    nombre: str
    paginas: int | None
    estado: str
    error: str | None
    fragmentos: int = 0
    subido_en: datetime


class PreguntaChat(BaseModel):
    pregunta: str = Field(min_length=1, max_length=2000)


class Fuente(BaseModel):
    n: int  # número de cita usado en la respuesta: [n]
    documento_id: int
    documento: str
    pagina: int


class RespuestaChat(BaseModel):
    respuesta: str
    fuentes: list[Fuente]
    modelo: str  # qué modelo respondió


class MensajeChat(BaseModel):
    id: int
    rol: str
    contenido: str
    fuentes: list[Fuente] | None
    modelo: str | None
    creado_en: datetime


class ResultadoBusqueda(BaseModel):
    fragmento_id: int
    documento_id: int
    documento: str
    pagina: int
    texto: str
    similitud: float
