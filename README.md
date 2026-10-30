# Salas de Estudio

Web para estudiar con IA: cada materia es una **sala** donde cargás tus apuntes y ejercicios en PDF, y chateás con un asistente que responde **usando solo tus apuntes** y citando documento y página.

Proyecto personal para aprender **RAG** (Retrieval-Augmented Generation).

## Cómo funciona

```
Subir PDF a una sala
  PDF → texto por página → fragmentos → embedding de cada fragmento → Postgres (pgvector)

Preguntar en una sala
  pregunta → embedding → fragmentos más parecidos DE ESA SALA
           → prompt al LLM con los fragmentos + historial → respuesta con citas
```

## Stack

| Parte | Tecnología |
|---|---|
| Backend | Python + FastAPI |
| Base y vectores | PostgreSQL 17 + pgvector (Docker) |
| PDFs | PyMuPDF |
| Embeddings | `intfloat/multilingual-e5-small` (local, gratis) |
| LLM | Intercambiable: Ollama, Gemini o Claude |
| Frontend | React + Vite (pendiente) |

## Estructura

```
backend/
  app/
    main.py        entrada de FastAPI
    config.py      configuración desde .env
    api/           endpoints (salas, documentos, chat)
    rag/           ingesta de PDFs, chunking, embeddings, búsqueda
    llm/           proveedores de LLM detrás de una misma interfaz
    db/            schema.sql y acceso a Postgres
  tests/
frontend/          app React (pendiente)
docs/eval/         preguntas de evaluación del RAG
data/uploads/      PDFs subidos (no se versionan)
```

## Levantar en local

Comandos para PowerShell (Windows):

```powershell
docker compose up -d
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\uvicorn app.main:app --reload
```

API en http://localhost:8000, documentación interactiva en http://localhost:8000/docs.

Tests (desde `backend/`): `.\.venv\Scripts\pytest`

La primera vez que se sube un PDF se descarga el modelo de embeddings (~500 MB).

## Etapas

1. **MVP:** crear salas, subir PDFs, chatear con citas.
2. **Calidad:** búsqueda híbrida, ver los fragmentos usados, abrir el PDF en la página citada.
3. **Modo estudio:** preguntas tipo parcial, explicación de ejercicios, resúmenes.
4. **Usuarios:** login, salas privadas y compartidas.
