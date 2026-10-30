from collections.abc import Iterator
from contextlib import contextmanager

import psycopg
from pgvector.psycopg import register_vector
from psycopg.rows import dict_row

from app.config import settings


@contextmanager
def conexion() -> Iterator[psycopg.Connection]:
    """Abre una conexión a Postgres, hace commit al salir y rollback si hubo error."""
    with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
        register_vector(conn)  # permite pasar y leer vectores como arrays de numpy
        yield conn
