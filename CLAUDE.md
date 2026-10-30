# Salas de Estudio

Proyecto personal de Cami para aprender RAG y sumar al portfolio. Ver README.md para el qué y el stack.

## Reglas del proyecto

- **Aislamiento por sala:** toda búsqueda de fragmentos filtra por `sala_id`. Nunca mezclar contenido de salas distintas.
- **LLM intercambiable:** el resto del código usa solo `app/llm/base.py` (`ProveedorLLM`). Nada fuera de `app/llm/` importa `anthropic`, `google.genai` u Ollama directamente.
- **Respuestas con citas:** el asistente responde solo con el contexto recuperado y cita documento y página. Si no está en los apuntes, lo dice.
- **Secretos:** las API keys van en `backend/.env` (ignorado por git). Repo público: nunca commitear claves ni PDFs de `data/uploads/`.
- Nombres de tablas, variables y textos de la UI en español, igual que el resto del código.

## Comandos

- Base: `docker compose up -d` (Postgres en el puerto **5433**). Recrear desde cero: `docker compose down -v`.
- Backend (desde `backend/`): `.venv/Scripts/uvicorn app.main:app --reload`
- Tests (desde `backend/`): `.venv/Scripts/pytest`

## Forma de trabajo

Cami está aprendiendo RAG: al implementar una pieza nueva (chunking, embeddings, búsqueda, prompt), explicar brevemente el porqué de las decisiones.

## Skills del proyecto

- `frontend-design` (de anthropics/skills): usarla al diseñar la UI del frontend.
