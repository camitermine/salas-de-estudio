import re
from dataclasses import dataclass
from pathlib import Path

import pymupdf


@dataclass
class Pagina:
    numero: int  # empieza en 1, como lo ve una persona
    texto: str


def extraer_paginas(ruta: Path) -> list[Pagina]:
    """Devuelve el texto de cada página del PDF.

    Se trabaja por página (y no con el texto entero) para poder citar
    la página exacta de donde salió cada fragmento.
    """
    paginas = []
    with pymupdf.open(ruta) as pdf:
        for i, pagina in enumerate(pdf, start=1):
            paginas.append(Pagina(numero=i, texto=_limpiar(pagina.get_text())))
    return paginas


def _limpiar(texto: str) -> str:
    texto = re.sub(r"[­​‌‍﻿]", "", texto)  # caracteres invisibles
    texto = re.sub(r"-\n(?=[a-záéíóúñ])", "", texto)  # palabras cortadas al final de línea
    texto = re.sub(r"[ \t]+", " ", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip()
