import { useState, type FormEvent } from 'react'
import type { Color, Sala } from '../api'
import { COLORES, NOMBRE_COLOR, PUNTO } from '../util'
import { Modal } from './Modal'

interface Props {
  sala?: Sala // si viene, se edita; si no, se crea
  alGuardar: (datos: { nombre: string; descripcion: string | null; color: Color }) => Promise<void>
  alCerrar: () => void
}

export function ModalSala({ sala, alGuardar, alCerrar }: Props) {
  const [nombre, setNombre] = useState(sala?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(sala?.descripcion ?? '')
  const [color, setColor] = useState<Color>(sala?.color ?? 'indigo')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await alGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, color })
    } catch (err) {
      setError((err as Error).message)
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={sala ? 'Editar sala' : 'Nueva sala'}
      descripcion={sala ? undefined : 'Una sala por materia. El chat de cada sala solo usa los apuntes que subas ahí.'}
      alCerrar={alCerrar}
    >
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-300">Nombre</span>
          <input
            autoFocus
            required
            maxLength={100}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Programación Concurrente"
            className="w-full rounded-lg border border-slate-700 bg-fondo px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-300">Descripción (opcional)</span>
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Hilos, sincronización, modelos de memoria compartida…"
            className="w-full resize-none rounded-lg border border-slate-700 bg-fondo px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-300">Color</legend>
          <div className="flex gap-3">
            {COLORES.map((c) => (
              <label key={c} className="cursor-pointer" title={NOMBRE_COLOR[c]}>
                <input
                  type="radio"
                  name="color"
                  value={c}
                  checked={color === c}
                  onChange={() => setColor(c)}
                  className="peer sr-only"
                  aria-label={NOMBRE_COLOR[c]}
                />
                <span
                  className={`block h-7 w-7 rounded-full ${PUNTO[c]} ring-offset-2 ring-offset-panel peer-checked:ring-2 peer-checked:ring-white peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300`}
                />
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !nombre.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {sala ? 'Guardar cambios' : 'Crear sala'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
