import type { Info } from '../api'
import { nombreModelo } from '../util'
import { Modal } from './Modal'

export function ModalInfo({ info, alCerrar }: { info: Info | null; alCerrar: () => void }) {
  return (
    <Modal titulo="Cómo funciona" alCerrar={alCerrar} ancho="max-w-lg">
      <ol className="space-y-4 text-sm text-slate-300">
        <li>
          <h3 className="font-semibold text-white">1. Subís tus apuntes</h3>
          <p className="mt-1">
            El texto de cada PDF se separa por página y se parte en fragmentos de unos{' '}
            {info?.tamano_fragmento ?? 1000} caracteres. Cada fragmento repite los últimos{' '}
            {info?.solapamiento ?? 150} del anterior, para que ninguna idea quede cortada.
          </p>
        </li>
        <li>
          <h3 className="font-semibold text-white">2. Se guardan como vectores</h3>
          <p className="mt-1">
            Un modelo de embeddings ({info?.embeddings ?? 'multilingual-e5-small'}, corre en tu compu) convierte
            cada fragmento en un vector que representa su significado. Se guardan en Postgres con pgvector, junto con
            la sala a la que pertenecen.
          </p>
        </li>
        <li>
          <h3 className="font-semibold text-white">3. Preguntás</h3>
          <p className="mt-1">
            Tu pregunta también se convierte en vector y se buscan los {info?.fragmentos_por_pregunta ?? 5}{' '}
            fragmentos más parecidos, solo dentro de esta sala.
          </p>
        </li>
        <li>
          <h3 className="font-semibold text-white">4. El modelo responde citando</h3>
          <p className="mt-1">
            Esos fragmentos se le pasan al modelo de lenguaje con la instrucción de responder solo con eso y citar
            cada dato. Los números entre corchetes de la respuesta llevan al fragmento y a la página del PDF.
          </p>
        </li>
      </ol>

      {info && (
        <p className="mt-5 rounded-lg border border-slate-800 bg-fondo p-3 text-sm text-slate-400">
          Ahora responde{' '}
          <span className="text-slate-200">
            {info.llm_disponibles.length
              ? info.llm_disponibles
                  .map((p) => nombreModelo(p === 'claude' ? info.modelo_claude : info.modelo_gemini))
                  .join(', y si falla, ')
              : 'ningún modelo (revisá las API keys del backend)'}
          </span>
          .
        </p>
      )}
    </Modal>
  )
}
