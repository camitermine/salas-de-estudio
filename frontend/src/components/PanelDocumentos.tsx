import {
  CheckIcon,
  CloudArrowUpIcon,
  FilePdfIcon,
  PencilSimpleIcon,
  SpinnerIcon,
  TrashIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { useRef, useState, type DragEvent } from 'react'
import type { Documento, Info, Sala } from '../api'
import { api } from '../api'
import { PUNTO, plural, tamano } from '../util'

interface Props {
  sala: Sala
  documentos: Documento[]
  info: Info | null
  alSubir: (archivos: File[]) => void
  alBorrarDocumento: (doc: Documento) => void
  alEditarSala: () => void
  alBorrarSala: () => void
}

export function PanelDocumentos({ sala, documentos, info, alSubir, alBorrarDocumento, alEditarSala, alBorrarSala }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)

  function soltar(e: DragEvent) {
    e.preventDefault()
    setArrastrando(false)
    const archivos = Array.from(e.dataTransfer.files)
    if (archivos.length) alSubir(archivos)
  }

  return (
    <section className="flex h-full w-80 flex-col border-r border-slate-800 bg-panel/50 md:w-96" aria-label="Apuntes de la sala">
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold text-white">
            <span className={`h-3 w-3 shrink-0 rounded-full ${PUNTO[sala.color]}`} />
            <span className="truncate">{sala.nombre}</span>
          </h2>
          <div className="flex shrink-0">
            <button
              onClick={alEditarSala}
              title="Editar sala"
              aria-label="Editar sala"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <PencilSimpleIcon size={15} />
            </button>
            <button
              onClick={alBorrarSala}
              title="Borrar sala"
              aria-label="Borrar sala"
              className="rounded-md p-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <TrashIcon size={15} />
            </button>
          </div>
        </div>
        {sala.descripcion && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{sala.descripcion}</p>}
      </div>

      <div className="border-b border-slate-800/80 p-4">
        <button
          onClick={() => entrada.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={`group w-full rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
            arrastrando
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-700 bg-panel-hundido/40 hover:border-indigo-500/80 hover:bg-indigo-500/5'
          }`}
        >
          <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400">
            <CloudArrowUpIcon size={20} weight="bold" />
          </span>
          <span className="block text-sm font-medium text-slate-200">
            Arrastrá tus PDFs o <span className="text-indigo-400 underline">elegilos</span>
          </span>
          <span className="mt-1 block text-xs text-slate-500">Apuntes, clases, ejercicios. Hasta 50 MB cada uno.</span>
        </button>
        <input
          ref={entrada}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => {
            const archivos = Array.from(e.target.files ?? [])
            if (archivos.length) alSubir(archivos)
            e.target.value = ''
          }}
        />
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 bg-panel-hundido/60 px-4 py-2 text-xs text-slate-400">
        <span>{plural(documentos.length, 'documento')}</span>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto p-3">
        {documentos.map((doc) => (
          <li
            key={doc.id}
            className="group flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-panel-hundido/80 p-2.5 hover:bg-slate-800"
          >
            <a
              href={doc.estado === 'listo' ? api.urlDocumento(doc.id) : undefined}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-2.5"
              title={doc.nombre}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/15 text-rose-400">
                <FilePdfIcon size={16} weight="bold" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-200 group-hover:text-indigo-300">
                  {doc.nombre}
                </span>
                <span className="block text-[11px] text-slate-500">{detalle(doc)}</span>
              </span>
            </a>
            <span className="flex shrink-0 items-center gap-1">
              <Estado doc={doc} />
              <button
                onClick={() => alBorrarDocumento(doc)}
                title="Quitar documento"
                aria-label={`Quitar ${doc.nombre}`}
                className="rounded p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 focus-visible:opacity-100"
              >
                <TrashIcon size={14} />
              </button>
            </span>
          </li>
        ))}

        {documentos.length === 0 && (
          <li className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs">
            <p className="font-medium text-slate-400">Esta sala todavía no tiene apuntes</p>
            <p className="mt-1 text-slate-500">Subí un PDF para empezar a hacer preguntas.</p>
          </li>
        )}
      </ul>

      {info && (
        <dl className="grid grid-cols-3 gap-1.5 border-t border-slate-800 bg-panel/80 p-3 text-center text-[11px]">
          <Parametro nombre="Fragmento" valor={`${info.tamano_fragmento} car.`} />
          <Parametro nombre="Solapamiento" valor={`${info.solapamiento} car.`} />
          <Parametro nombre="Por pregunta" valor={plural(info.fragmentos_por_pregunta, 'fragmento')} />
        </dl>
      )}
    </section>
  )
}

function detalle(doc: Documento): string {
  if (doc.estado === 'error') return doc.error ?? 'No se pudo procesar'
  const partes = [tamano(doc.tamano_bytes)]
  if (doc.estado === 'listo') {
    if (doc.paginas) partes.push(plural(doc.paginas, 'página'))
    partes.push(plural(doc.fragmentos, 'fragmento'))
  }
  return partes.filter(Boolean).join(', ')
}

function Estado({ doc }: { doc: Documento }) {
  if (doc.estado === 'listo')
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
        <CheckIcon size={9} weight="bold" /> Listo
      </span>
    )
  if (doc.estado === 'procesando')
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
        <SpinnerIcon size={9} className="animate-spin" /> Procesando
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-400">
      <WarningCircleIcon size={9} weight="bold" /> Error
    </span>
  )
}

function Parametro({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-800/80 p-1.5">
      <dt className="text-slate-500">{nombre}</dt>
      <dd className="font-semibold text-slate-200">{valor}</dd>
    </div>
  )
}
