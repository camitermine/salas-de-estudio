from app.rag.busqueda import Resultado
from app.rag.prompt import armar_mensaje, extraer_fuentes


def _fragmento(n: int, pagina: int) -> Resultado:
    return Resultado(
        fragmento_id=n, documento_id=10, documento="apunte.pdf",
        pagina=pagina, texto=f"texto {n}", similitud=0.9,
    )


FRAGMENTOS = [_fragmento(1, 4), _fragmento(2, 7), _fragmento(3, 9)]


def test_mensaje_numera_fragmentos_con_documento_y_pagina():
    mensaje = armar_mensaje("¿Qué es un hilo?", FRAGMENTOS)
    assert "[1] (apunte.pdf, pág. 4)\ntexto 1" in mensaje
    assert "[3] (apunte.pdf, pág. 9)\ntexto 3" in mensaje
    assert mensaje.endswith("Pregunta: ¿Qué es un hilo?")


def test_mensaje_sin_fragmentos_lo_avisa():
    assert "no tiene apuntes cargados" in armar_mensaje("hola", [])


def test_fuentes_solo_las_citadas_en_orden_y_sin_repetir():
    fuentes = extraer_fuentes("Un hilo es X [3]. También Y [1][3].", FRAGMENTOS)
    assert [(f["n"], f["pagina"]) for f in fuentes] == [(3, 9), (1, 4)]


def test_ignora_citas_que_no_existen():
    assert extraer_fuentes("Según [7] y [0].", FRAGMENTOS) == []


def test_respuesta_sin_citas_no_tiene_fuentes():
    assert extraer_fuentes("Eso no aparece en tus apuntes.", FRAGMENTOS) == []
