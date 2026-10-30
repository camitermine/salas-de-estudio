// Tipos y llamadas al backend. Las rutas van con /api y Vite las reenvía (ver vite.config.ts).

export type Color = 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple'

export interface Sala {
  id: number
  nombre: string
  descripcion: string | null
  color: Color
  creada_en: string
  documentos: number
}

export interface Documento {
  id: number
  sala_id: number
  nombre: string
  paginas: number | null
  tamano_bytes: number | null
  estado: 'procesando' | 'listo' | 'error'
  error: string | null
  fragmentos: number
  subido_en: string
}

export interface Fuente {
  n: number
  documento_id: number
  documento: string
  pagina: number
  texto: string
  similitud: number | null
}

export interface Mensaje {
  id: number
  rol: 'usuario' | 'asistente'
  contenido: string
  fuentes: Fuente[] | null
  modelo: string | null
  creado_en: string
}

export interface RespuestaChat {
  respuesta: string
  fuentes: Fuente[]
  modelo: string
}

export interface Info {
  llm_disponibles: string[]
  modelo_claude: string
  modelo_gemini: string
  embeddings: string
  tamano_fragmento: number
  solapamiento: number
  fragmentos_por_pregunta: number
}

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let r: Response
  try {
    r = await fetch(`/api${ruta}`, opciones)
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
  }
  if (!r.ok) {
    const cuerpo = await r.json().catch(() => null)
    const detalle = typeof cuerpo?.detail === 'string' ? cuerpo.detail : `Error ${r.status}`
    throw new Error(detalle)
  }
  return (r.status === 204 ? undefined : await r.json()) as T
}

const json = (metodo: string, cuerpo: unknown): RequestInit => ({
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo),
})

export const api = {
  info: () => pedir<Info>('/info'),

  salas: () => pedir<Sala[]>('/salas'),
  crearSala: (datos: { nombre: string; descripcion: string | null; color: Color }) =>
    pedir<Sala>('/salas', json('POST', datos)),
  editarSala: (id: number, datos: Partial<Pick<Sala, 'nombre' | 'descripcion' | 'color'>>) =>
    pedir<Sala>(`/salas/${id}`, json('PATCH', datos)),
  borrarSala: (id: number) => pedir<void>(`/salas/${id}`, { method: 'DELETE' }),

  documentos: (salaId: number) => pedir<Documento[]>(`/salas/${salaId}/documentos`),
  subirDocumento: (salaId: number, archivo: File) => {
    const form = new FormData()
    form.append('archivo', archivo)
    return pedir<Documento>(`/salas/${salaId}/documentos`, { method: 'POST', body: form })
  },
  borrarDocumento: (id: number) => pedir<void>(`/documentos/${id}`, { method: 'DELETE' }),
  urlDocumento: (id: number, pagina?: number) =>
    `/api/documentos/${id}/archivo${pagina ? `#page=${pagina}` : ''}`,

  mensajes: (salaId: number) => pedir<Mensaje[]>(`/salas/${salaId}/mensajes`),
  preguntar: (salaId: number, pregunta: string) =>
    pedir<RespuestaChat>(`/salas/${salaId}/chat`, json('POST', { pregunta })),
  borrarMensajes: (salaId: number) => pedir<void>(`/salas/${salaId}/mensajes`, { method: 'DELETE' }),
}
