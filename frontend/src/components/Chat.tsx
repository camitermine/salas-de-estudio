import {
  BroomIcon,
  FilesIcon,
  LightbulbIcon,
  MagnifyingGlassIcon,
  PaperPlaneRightIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Sala } from '../api'
import { PUNTO, plural } from '../util'
import { BurbujaMensaje, type MensajeVista } from './BurbujaMensaje'

const SUGERENCIAS = [
  'Resumí los temas principales de los apuntes',
  'Haceme 3 preguntas tipo parcial con sus respuestas',
  'Explicame el concepto más importante con un ejemplo',
]

interface Props {
  sala: Sala
  mensajes: MensajeVista[]
  documentosListos: number
  procesando: boolean // hay PDFs todavía procesándose
  esperando: boolean
  alPreguntar: (pregunta: string) => void
  alLimpiar: () => void
  alVerDocumentos: () => void // solo en pantallas chicas, donde el panel está oculto
}

export function Chat({
  sala,
  mensajes,
  documentosListos,
  procesando,
  esperando,
  alPreguntar,
  alLimpiar,
  alVerDocumentos,
}: Props) {
  const [texto, setTexto] = useState('')
  const final = useRef<HTMLDivElement>(null)
  const sinApuntes = documentosListos === 0
  const puedePreguntar = !sinApuntes && !esperando

  useEffect(() => {
    final.current?.scrollIntoView({ block: 'end' })
  }, [mensajes.length, esperando])

  function enviar(pregunta: string) {
    if (!pregunta.trim() || !puedePreguntar) return
    alPreguntar(pregunta.trim())
    setTexto('')
  }

  function teclas(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar(texto)
    }
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-fondo">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${PUNTO[sala.color]}`} />
          <h1 className="truncate text-sm font-semibold text-white">{sala.nombre}</h1>
          <button
            onClick={alVerDocumentos}
            className="flex shrink-0 items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 lg:hidden"
          >
            <FilesIcon size={11} />
            {plural(documentosListos, 'PDF listo', 'PDFs listos')}
          </button>
        </div>
        {mensajes.length > 0 && (
          <button
            onClick={alLimpiar}
            title="Empezar una conversación nueva (los apuntes quedan)"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800 bg-panel px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <BroomIcon size={13} />
            <span className="hidden sm:inline lg:hidden xl:inline">Nueva conversación</span>
          </button>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-8">
        {mensajes.length === 0 && <Bienvenida sala={sala} sinApuntes={sinApuntes} procesando={procesando} />}
        {mensajes.map((m) => (
          <BurbujaMensaje key={m.id} mensaje={m} />
        ))}
        {esperando && (
          <div className="mr-auto flex max-w-md gap-3" role="status">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-600/30 text-indigo-400">
              <SparkleIcon size={14} weight="bold" />
            </span>
            <p className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-800 bg-panel px-4 py-3 text-xs text-slate-400">
              <MagnifyingGlassIcon size={13} className="animate-pulse text-indigo-400" />
              Buscando en tus apuntes…
            </p>
          </div>
        )}
        <div ref={final} />
      </div>

      <div className="shrink-0 border-t border-slate-800 bg-panel/90 p-4 md:px-8">
        {!sinApuntes && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            <LightbulbIcon size={13} className="shrink-0 text-amber-400" aria-label="Sugerencias" />
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                disabled={!puedePreguntar}
                className="shrink-0 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e: FormEvent) => (e.preventDefault(), enviar(texto))} className="mt-1 flex items-end gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={teclas}
            rows={2}
            disabled={sinApuntes}
            aria-label="Tu pregunta"
            placeholder={
              sinApuntes
                ? 'Subí un PDF a esta sala para poder preguntar'
                : 'Preguntá sobre tus apuntes. Enter para enviar, Shift+Enter para otra línea.'
            }
            className="flex-1 resize-none rounded-2xl border border-slate-700 bg-fondo p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!puedePreguntar || !texto.trim()}
            aria-label="Enviar pregunta"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperPlaneRightIcon size={18} weight="bold" />
          </button>
        </form>
        <p className="mt-2 flex items-center gap-1 px-1 text-[11px] text-slate-500">
          <ShieldCheckIcon size={12} className="text-emerald-400" />
          Las respuestas salen solo de los apuntes de esta sala.
        </p>
      </div>
    </main>
  )
}

function Bienvenida({ sala, sinApuntes, procesando }: { sala: Sala; sinApuntes: boolean; procesando: boolean }) {
  let texto = 'Preguntá lo que necesites repasar. Cada respuesta cita el PDF y la página de donde sale.'
  if (sinApuntes)
    texto = procesando
      ? 'Tus PDFs se están procesando. En cuanto estén listos vas a poder preguntar.'
      : 'Subí los apuntes, clases o ejercicios de la materia y después preguntá lo que necesites repasar.'
  return (
    <div className="mx-auto mt-10 max-w-md text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white">
        <SparkleIcon size={18} weight="bold" />
      </span>
      <h2 className="text-base font-semibold text-white">{sala.nombre}</h2>
      <p className="mt-1 text-sm text-slate-400">{texto}</p>
    </div>
  )
}
