# Salas de Estudio

Web para estudiar con IA: cada materia es una **sala** donde cargás tus apuntes y ejercicios en PDF, y chateás con un asistente que responde **usando solo tus apuntes** y citando documento y página.

Proyecto personal para aprender **RAG** (Retrieval-Augmented Generation).

Decisiones de diseño, alcance actual y plan de la próxima iteración (cuentas de usuario y nube): [docs/DISENO.md](docs/DISENO.md).

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
| LLM | Claude Haiku, con Gemini de respaldo si falla o se terminan los créditos |
| Frontend | React + Vite + TypeScript + Tailwind |

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
frontend/src/
  App.tsx          estado de la app y distribución en tres columnas
  api.ts           tipos y llamadas al backend
  components/      salas, documentos, chat y citas
docs/DISENO.md     decisiones de diseño y plan post-MVP
docs/mockup/       mockup de referencia de la interfaz
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

Completar en `backend/.env` las claves `ANTHROPIC_API_KEY` y/o `GEMINI_API_KEY`.

API en http://localhost:8000, documentación interactiva en http://localhost:8000/docs.

Frontend, en otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

App en http://localhost:5173 (Vite reenvía `/api` al backend).

Tests (desde `backend/`): `.\.venv\Scripts\pytest`

La primera vez que se sube un PDF se descarga el modelo de embeddings (~500 MB).

## Etapas

1. **MVP:** crear salas, subir PDFs, chatear con citas, ver los fragmentos usados y abrir el PDF en la página citada. ✅
2. **Calidad:** búsqueda híbrida, reescribir repreguntas con el historial, set de evaluación.
3. **Modo estudio:** preguntas tipo parcial, explicación de ejercicios, resúmenes.
4. **Usuarios y nube:** cuentas, login, salas, archivos e historial por usuario, con límites de uso. Ver [docs/DISENO.md](docs/DISENO.md#iteración-2-usuarios-sesiones-y-nube).
