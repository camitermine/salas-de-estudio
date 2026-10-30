# Diseño de Salas de Estudio

Documento vivo con las decisiones del proyecto y lo que viene después del MVP.

## Alcance del MVP (iteración 1)

Una sola persona usando la app en su propia compu. No hay cuentas ni login: todos los que abran la app ven las mismas salas.

### Dónde se guarda cada cosa hoy

| Qué | Dónde | Se borra cuando… |
|---|---|---|
| Salas, documentos, fragmentos con sus vectores y conversaciones | Postgres en Docker (volumen `pgdata`) | se borra desde la app, o con `docker compose down -v` |
| Archivos PDF | `data/uploads/<sala_id>/` en el disco | se borra el documento o la sala |
| Sala abierta la última vez | `localStorage` del navegador | se limpian los datos del sitio |

Cerrar la página o apagar la compu **no** borra nada: al volver a levantar Docker y el backend, todo sigue ahí.

### Arquitectura

```
Navegador (React + Vite, :5173)
   │  /api/...  (Vite lo reenvía al backend)
   ▼
FastAPI (:8000)
   ├─ Ingesta:  PDF → texto por página → fragmentos → embeddings (e5-small, local)
   ├─ Búsqueda: pregunta → embedding → top-5 por similitud coseno, filtrado por sala
   ├─ Chat:     prompt con fragmentos numerados → LLM → respuesta con citas [n]
   └─ LLM:      Claude Haiku → si falla o no hay créditos → Gemini
   ▼
Postgres 17 + pgvector (Docker, :5433)
```

### Decisiones y por qué

- **Postgres + pgvector en lugar de una base vectorial aparte** (Chroma, Pinecone): una sola base guarda salas, mensajes y vectores. El aislamiento por sala es un `WHERE sala_id = …`.
- **Embeddings locales** (`multilingual-e5-small`): no cuestan nada, andan en español y los apuntes no salen de la compu para indexarse. Requieren los prefijos `passage:` / `query:`.
- **Fragmentos de ~1000 caracteres con 150 de solapamiento, siempre dentro de una página**: así la cita apunta a una página exacta.
- **Los fragmentos van en el mensaje de cada pregunta, no en el historial guardado**: la conversación no se infla y cada turno trae su propio contexto.
- **Cadena de proveedores de LLM**: Claude Haiku es rápido (~2-5 s) y barato; Gemini (plan gratuito) queda de respaldo. Un error definitivo (sin créditos, key inválida) saca al proveedor de la cadena hasta reiniciar.
- **El `.env` del proyecto le gana a las variables de entorno del sistema**, para que una key vieja definida en Windows no pise la del proyecto.

### Interfaz

La referencia visual es [mockup/mockup_salas_de_estudio_rag.html](mockup/mockup_salas_de_estudio_rag.html): tema oscuro en gris pizarra con acento índigo, tres columnas (salas | documentos | chat). Del mockup se dejaron afuera los elementos que no reflejarían el sistema real (ChromaDB, BM25, sliders de chunking editables, cuota de memoria, avatar de usuario).

El elemento central son las **citas clickeables**: cada `[n]` de una respuesta abre el fragmento original con documento, página y similitud, y desde ahí se abre el PDF en esa página.

### Limitaciones conocidas

- Las repreguntas ("¿y eso para qué sirve?") se buscan con el texto literal; conviene reescribirlas usando el historial antes de buscar.
- Los números de cita se reinician en cada respuesta, así que si el modelo menciona "el fragmento [1]" de una respuesta anterior, el botón muestra el `[1]` actual.
- La similitud de e5 queda comprimida (≈0,78–0,92 incluso para preguntas sin relación), así que todavía no hay un umbral de "no es relevante".
- PDFs escaneados (sin texto) no se soportan.

## Iteración 2: usuarios, sesiones y nube

Objetivo: que cualquiera pueda crearse una cuenta, iniciar sesión y encontrar sus salas, sus archivos y su historial de chat, con la app publicada en internet. También es una excusa para aprender servicios de nube, priorizando opciones gratuitas o con créditos para estudiantes.

### Qué tiene que cambiar

- **Cuentas:** registro, login, logout y recuperación de contraseña, idealmente con un proveedor de identidad en lugar de guardar contraseñas propias.
- **Datos por usuario:** tabla `usuarios` y `salas.usuario_id`. Toda consulta filtra por usuario, igual que hoy toda búsqueda filtra por sala. La regla de aislamiento pasa a ser usuario → sala.
- **Archivos en almacenamiento de objetos** en lugar del disco local, con URLs firmadas para abrir los PDFs.
- **Límites por usuario,** para que el costo sea predecible: por ejemplo 5 salas, 20 PDFs por sala, 50 MB por PDF y un tope de preguntas por día. Los créditos de Claude son compartidos, así que el tope de preguntas es indispensable antes de publicar.
- **Ingesta en una cola** (no en el mismo proceso que la API), porque en la nube el proceso web puede reiniciarse a mitad de un PDF.
- **El modelo de embeddings** ocupa ~500 MB de RAM: hay que elegir un hosting que lo soporte o pasar a una API de embeddings.

### Opciones a evaluar

Las condiciones de los planes gratuitos cambian seguido: verificarlas al momento de elegir.

| Pieza | Camino AWS (más aprendizaje) | Alternativa simple / gratuita |
|---|---|---|
| Cuentas y login | Amazon Cognito | Supabase Auth, Clerk |
| Base de datos + pgvector | Amazon RDS for PostgreSQL | Neon, Supabase |
| Archivos PDF | Amazon S3 | Supabase Storage, Cloudflare R2 |
| Backend (FastAPI) | AWS App Runner, o Lambda con imagen de contenedor | Render, Fly.io, Hugging Face Spaces (Docker) |
| Cola de ingesta | Amazon SQS + Lambda | Tarea en segundo plano en el mismo servicio |
| Frontend | S3 + CloudFront, AWS Amplify Hosting | GitHub Pages, Vercel, Netlify |

**Beneficios para estudiantes que vale la pena revisar con el mail de la facultad:**

- GitHub Student Developer Pack: incluye créditos y planes gratuitos de varios proveedores de nube y hosting.
- AWS Educate y los créditos de AWS para estudiantes; además el plan gratuito de AWS para cuentas nuevas.
- Azure for Students: créditos sin tarjeta de crédito.
- Google Cloud: créditos de prueba y programas educativos.

**Propuesta inicial para aprender AWS sin gastar:** Cognito para cuentas, S3 para los PDFs, el backend en un contenedor (App Runner o ECS), y la base en RDS si entra en el plan gratuito, o en Neon si no. El frontend en S3 + CloudFront o Amplify.

**Propuesta más simple si el objetivo es publicarlo rápido:** Supabase para auth, base con pgvector y archivos, y el backend en un servicio de contenedores con plan gratuito.

### Seguridad antes de publicar

- Las API keys de los LLM viven solo en el backend, nunca en el frontend.
- Límite de uso por usuario y por IP (rate limiting) en el endpoint de chat.
- Validar tamaño y tipo de archivo en el backend (hoy ya se valida que sea PDF y que pese menos de 50 MB).
- Cada usuario solo puede leer sus salas, documentos y PDFs.
