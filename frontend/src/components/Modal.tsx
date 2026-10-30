import { XIcon } from '@phosphor-icons/react'
import { useEffect, type ReactNode } from 'react'

interface Props {
  titulo: string
  descripcion?: string
  alCerrar: () => void
  children: ReactNode
  ancho?: string
}

export function Modal({ titulo, descripcion, alCerrar, children, ancho = 'max-w-md' }: Props) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [alCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className={`w-full ${ancho} max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-panel p-6 shadow-2xl`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-titulo" className="text-lg font-semibold text-white">
              {titulo}
            </h2>
            {descripcion && <p className="mt-1 text-sm text-slate-400">{descripcion}</p>}
          </div>
          <button
            onClick={alCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <XIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
