from app.rag.chunking import MINIMO, partir_en_fragmentos


def _oraciones(n: int) -> str:
    return " ".join(f"Esta es la oración número {i} del apunte de prueba." for i in range(n))


def test_texto_corto_queda_en_un_fragmento():
    texto = "La derivada mide la tasa de cambio instantánea de una función."
    assert partir_en_fragmentos(texto) == [texto]


def test_ningun_fragmento_supera_el_tamano():
    fragmentos = partir_en_fragmentos(_oraciones(100), tamano=300, solapamiento=60)
    assert len(fragmentos) > 1
    assert all(len(f) <= 300 for f in fragmentos)


def test_no_corta_oraciones_al_medio():
    for fragmento in partir_en_fragmentos(_oraciones(100), tamano=300, solapamiento=60):
        assert fragmento.startswith("Esta es la oración")
        assert fragmento.endswith(".")


def test_fragmentos_consecutivos_se_solapan():
    a, b, *_ = partir_en_fragmentos(_oraciones(100), tamano=300, solapamiento=60)
    ultima_oracion_de_a = a.split(". ")[-1]
    assert b.startswith(ultima_oracion_de_a.rstrip("."))


def test_oracion_mas_larga_que_el_tamano_se_corta():
    fragmentos = partir_en_fragmentos("x" * 2500, tamano=1000)
    assert [len(f) for f in fragmentos] == [1000, 1000, 500]


def test_descarta_restos_sin_contenido():
    assert partir_en_fragmentos("12") == []
    assert all(len(f) >= MINIMO for f in partir_en_fragmentos("Pág. 3\n\n" + _oraciones(3)))
