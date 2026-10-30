import re

# ~1000 caracteres son unos 250 tokens: entra cómodo en el límite de 512 tokens
# del modelo de embeddings y alcanza para una idea completa (una definición,
# un enunciado de ejercicio). Fragmentos más grandes "diluyen" el significado
# del embedding; más chicos pierden contexto.
TAMANO = 1000

# Cada fragmento repite el final del anterior. Así una idea que cae justo en
# el corte aparece entera en al menos uno de los dos.
SOLAPAMIENTO = 150

# Descarta restos sin contenido: números de página, encabezados sueltos.
MINIMO = 40

_FIN_DE_ORACION = re.compile(r"(?<=[.!?:;])\s+|\n+")


def partir_en_fragmentos(
    texto: str, tamano: int = TAMANO, solapamiento: int = SOLAPAMIENTO
) -> list[str]:
    """Parte el texto en fragmentos de hasta `tamano` caracteres.

    Corta entre oraciones para no partir una frase al medio; solo si una
    oración sola supera el tamaño se la corta por caracteres.
    """
    oraciones = [o.strip() for o in _FIN_DE_ORACION.split(texto) if o.strip()]
    oraciones = [parte for o in oraciones for parte in _cortar_si_es_larga(o, tamano)]

    fragmentos: list[str] = []
    actual: list[str] = []
    largo = 0

    for oracion in oraciones:
        if actual and largo + len(oracion) + 1 > tamano:
            fragmentos.append(" ".join(actual))
            actual = _cola(actual, solapamiento)
            largo = sum(len(o) + 1 for o in actual)
        actual.append(oracion)
        largo += len(oracion) + 1

    if actual:
        fragmentos.append(" ".join(actual))

    return [f for f in fragmentos if len(f) >= MINIMO]


def _cortar_si_es_larga(oracion: str, tamano: int) -> list[str]:
    if len(oracion) <= tamano:
        return [oracion]
    return [oracion[i : i + tamano] for i in range(0, len(oracion), tamano)]


def _cola(oraciones: list[str], solapamiento: int) -> list[str]:
    """Últimas oraciones del fragmento que entran en `solapamiento` caracteres."""
    cola: list[str] = []
    largo = 0
    for oracion in reversed(oraciones):
        if largo + len(oracion) > solapamiento:
            break
        cola.insert(0, oracion)
        largo += len(oracion) + 1
    return cola
