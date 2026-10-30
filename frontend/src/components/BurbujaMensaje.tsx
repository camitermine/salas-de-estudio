import { ArrowSquareOutIcon, FilePdfIcon, QuotesIcon, SparkleIcon, WarningIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import Markdown from 'react-markdown'
import type { Fuente, Mensaje } from '../api'
import { api } from '../api'
import { nombreModelo, plural } from '../util'

export interface MensajeVista extends Mensaje {
  error?: boolean // mensaje local que muestra un error del servidor
}

export function BurbujaMensaje({ mensaje }: { mensaje: MensajeVista }) {
  if (mensaje.rol === 'usuario') {
    return (
      <div className="ml-auto flex max-w-3xl flex-row-reverse gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold text-white">
          Vos
        </span>
        <p className="rounded-2xl rounded-tr-none bg-indigo-600 px-4 py-3 text-sm whitespace-pre-wrap text-white">
          {mensaje.contenido}
        </p>
      </div>
    )
  }
  if (mensaje.error) {
    return (
      <div className="mr-auto flex max-w-3xl gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
          <WarningIcon size={15} weight="bold" />
        </span>
        <p className="rounded-2xl rounded-tl-none border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {mensaje.contenido}
        </p>
      </div>
    )
  }
  return <RespuestaAsistente mensaje={mensaje} />
}

function RespuestaAsistente({ mensaje }: { mensaje: MensajeVista }) {
  const fuentes = mensaje.fuentes ?? []
  const [abiertas, setAbiertas] = useState(false)
  const [resaltada, setResaltada] = useState<number | null>(null)
  const lista = useRef<HTMLDivElement>(null)

  function verCita(n: number) {
    setAbiertas(true)
    setResaltada(n)
    // Espera a que se abra la lista antes de llevar la cita a la vista.
    requestAnimationFrame(() =>
      lista.current?.querySelector(`[data-cita="${n}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    )
  }

  return (
    <div className="mr-auto flex max-w-3xl gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white">
        <SparkleIcon size={14} weight="bold" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-panel px-4 py-3">
          <div className="respuesta">
            <Markdown
              components={{
                a: ({ href, children }) => {
                  const n = href?.startsWith('#cita-') ? Number(href.slice(6)) : null
                  if (n == null) return <a href={href} target="_blank" rel="noreferrer" className="text-indigo-300 underline">{children}</a>
                  return (
                    <button
                      onClick={() => verCita(n)}
                      title="Ver de dónde sale"
                      className={`mx-0.5 inline-flex h-5 min-w-5 -translate-y-px items-center justify-center rounded-md border px-1 align-middle text-[11px] font-semibold transition-colors ${
                        resaltada === n
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/30'
                      }`}
                    >
                      {n}
                    </button>
                  )
                },
              }}
            >
              {conCitas(mensaje.contenido, fuentes)}
            </Markdown>
          </div>

          {fuentes.length > 0 && (
            <div className="mt-3 border-t border-slate-800 pt-2">
              <button
                onClick={() => setAbiertas(!abiertas)}
                aria-expanded={abiertas}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                <QuotesIcon size={13} weight="bold" className={`transition-transform ${abiertas ? 'rotate-90' : ''}`} />
                {abiertas ? 'Ocultar' : 'Ver'} {plural(fuentes.length, 'fuente')}
              </button>
              {abiertas && (
                <div ref={lista} className="mt-2 space-y-2">
                  {fuentes.map((f) => (
                    <TarjetaFuente key={f.n} fuente={f} resaltada={resaltada === f.n} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mt-1 px-1 text-[11px] text-slate-500">{nombreModelo(mensaje.modelo)}</p>
      </div>
    </div>
  )
}

function TarjetaFuente({ fuente, resaltada }: { fuente: Fuente; resaltada: boolean }) {
  return (
    <div
      data-cita={fuente.n}
      className={`rounded-lg border p-2.5 text-xs transition-colors ${
        resaltada ? 'border-indigo-500/70 bg-indigo-950/40' : 'border-slate-700/70 bg-fondo/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <a
          href={api.urlDocumento(fuente.documento_id, fuente.pagina)}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-1.5 font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
          title="Abrir el PDF en esta página"
        >
          <span className="flex h-4 min-w-4 items-center justify-center rounded bg-indigo-500/20 px-1 text-[10px] text-indigo-200">
            {fuente.n}
          </span>
          <FilePdfIcon size={13} weight="bold" className="shrink-0 text-rose-400" />
          <span className="truncate">{fuente.documento}</span>
          <span className="shrink-0 text-slate-400">pág. {fuente.pagina}</span>
          <ArrowSquareOutIcon size={12} className="shrink-0" />
        </a>
        {fuente.similitud != null && (
          <span
            className="shrink-0 text-[10px] text-slate-500"
            title="Qué tan parecido es este fragmento a tu pregunta (1 = idéntico)"
          >
            similitud {fuente.similitud.toFixed(2)}
          </span>
        )}
      </div>
      {fuente.texto && <p className="mt-1.5 line-clamp-4 leading-relaxed text-slate-400">{fuente.texto}</p>}
    </div>
  )
}

/** Convierte "[2]" en un link "#cita-2" que el componente `a` dibuja como botón. */
function conCitas(texto: string, fuentes: Fuente[]): string {
  const existentes = new Set(fuentes.map((f) => f.n))
  return texto.replace(/\[(\d+)\](?!\()/g, (cita, n) => (existentes.has(Number(n)) ? `[${n}](#cita-${n})` : cita))
}
