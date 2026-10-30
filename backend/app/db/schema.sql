-- Se ejecuta solo la primera vez que se crea el volumen de Postgres.
-- Para recrearlo: docker compose down -v && docker compose up -d

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE salas (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    descripcion TEXT,
    color       TEXT NOT NULL DEFAULT 'indigo',  -- color de etiqueta en la UI
    creada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documentos (
    id         SERIAL PRIMARY KEY,
    sala_id    INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    nombre     TEXT NOT NULL,           -- nombre original del PDF
    ruta       TEXT NOT NULL,           -- dónde quedó guardado en disco
    paginas    INTEGER,
    tamano_bytes INTEGER,
    estado     TEXT NOT NULL DEFAULT 'procesando',  -- procesando | listo | error
    error      TEXT,                    -- motivo, si estado = 'error'
    subido_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cada fragmento de texto de un PDF con su embedding.
-- sala_id está duplicado a propósito: la búsqueda siempre filtra por sala.
CREATE TABLE fragmentos (
    id           SERIAL PRIMARY KEY,
    documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    sala_id      INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    pagina       INTEGER NOT NULL,
    orden        INTEGER NOT NULL,      -- posición del fragmento dentro del documento
    texto        TEXT NOT NULL,
    embedding    vector(384) NOT NULL   -- 384 = dimensión de multilingual-e5-small
);

CREATE INDEX fragmentos_sala_idx ON fragmentos (sala_id);
CREATE INDEX fragmentos_embedding_idx ON fragmentos USING hnsw (embedding vector_cosine_ops);

CREATE TABLE mensajes (
    id        SERIAL PRIMARY KEY,
    sala_id   INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    rol       TEXT NOT NULL,            -- usuario | asistente
    contenido TEXT NOT NULL,
    fuentes   JSONB,                    -- citas usadas en la respuesta: [{documento_id, pagina}]
    modelo    TEXT,                     -- qué modelo generó la respuesta (solo asistente)
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mensajes_sala_idx ON mensajes (sala_id, creado_en);
