import { FolderDashedIcon, MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import type { Sala } from '../api'
import { PUNTO, plural } from '../util'

interface Props {
  salas: Sala[]
  activaId: number | null
  alElegir: (id: number) => void
  alCrear: () => void
}

export function BarraSalas({ salas, activaId, alElegir, alCrear }: Props) {
  const [filtro, setFiltro] = useState('')
  const texto = filtro.trim().toLowerCase()
  const visibles = salas.filter(
    (s) => s.nombre.toLowerCase().includes(texto) || (s.descripcion ?? '').toLowerCase().includes(texto),
  )

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-panel">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Tus salas</h2>
        <button
          onClick={alCrear}
          title="Nueva sala"
          aria-label="Nueva sala"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95"
        >
          <PlusIcon size={14} weight="bold" />
        </button>
      </div>

      {salas.length > 3 && (
        <div className="border-b border-slate-800/60 px-3 py-2">
          <div className="relative">
            <MagnifyingGlassIcon size={12} className="absolute top-2.5 left-2.5 text-slate-500" />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar sala"
              aria-label="Buscar sala"
              className="w-full rounded-lg border border-slate-800 bg-fondo py-1.5 pr-2.5 pl-7 text-xs text-slate-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Salas">
        {visibles.map((sala) => {
          const activa = sala.id === activaId
          return (
            <button
              key={sala.id}
              onClick={() => alElegir(sala.id)}
              aria-current={activa ? 'page' : undefined}
              className={`w-full rounded-xl border p-2.5 text-left transition-colors ${
                activa
                  ? 'border-indigo-500/50 bg-slate-800/90'
                  : 'border-transparent hover:border-slate-800 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${PUNTO[sala.color]}`} />
                  <span className={`truncate text-sm font-medium ${activa ? 'text-white' : 'text-slate-300'}`}>
                    {sala.nombre}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-slate-500">{plural(sala.documentos, 'PDF', 'PDFs')}</span>
              </div>
              {sala.descripcion && (
                <p className="mt-1 truncate pl-5 text-xs text-slate-500">{sala.descripcion}</p>
              )}
            </button>
          )
        })}

        {salas.length > 0 && visibles.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-500">
            <FolderDashedIcon size={24} className="mx-auto mb-1 text-slate-600" />
            Ninguna sala coincide con “{filtro}”
          </p>
        )}
      </nav>
    </aside>
  )
}
