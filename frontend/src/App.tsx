import { BrainIcon, InfoIcon, ListIcon } from '@phosphor-icons/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, type Documento, type Info, type Sala } from './api'
import { BarraSalas } from './components/BarraSalas'
import type { MensajeVista } from './components/BurbujaMensaje'
import { Chat } from './components/Chat'
import { ModalInfo } from './components/ModalInfo'
import { ModalSala } from './components/ModalSala'
import { PanelDocumentos } from './components/PanelDocumentos'
import { nombreModelo } from './util'

const CLAVE_SALA = 'sala-activa'

function leerSalaGuardada(): number | null {
  try {
    const v = localStorage.getItem(CLAVE_SALA)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

export default function App() {
  const [salas, setSalas] = useState<Sala[] | null>(null)
  const [activaId, setActivaId] = useState<number | null>(leerSalaGuardada)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [mensajes, setMensajes] = useState<MensajeVista[]>([])
  const [esperando, setEsperando] = useState(false)
  const [info, setInfo] = useState<Info | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [modal, setModal] = useState<'crear' | 'editar' | 'info' | null>(null)
  const [cajon, setCajon] = useState<'salas' | 'documentos' | null>(null) // paneles en pantallas chicas

  const activa = salas?.find((s) => s.id === activaId) ?? null

  const avisar = useCallback((texto: string) => {
    setAviso(texto)
    window.setTimeout(() => setAviso((actual) => (actual === texto ? null : actual)), 4000)
  }, [])

  const cargarSalas = useCallback(async () => {
    try {
      const lista = await api.salas()
      setSalas(lista)
      setErrorCarga(null)
      // Si la sala guardada ya no existe, se abre la primera.
      setActivaId((id) => (lista.some((s) => s.id === id) ? id : (lista[0]?.id ?? null)))
    } catch (e) {
      setErrorCarga((e as Error).message)
    }
  }, [])

  useEffect(() => {
    cargarSalas()
    api.info().then(setInfo).catch(() => {})
  }, [cargarSalas])

  useEffect(() => {
    try {
      if (activaId != null) localStorage.setItem(CLAVE_SALA, String(activaId))
    } catch {
      /* sin localStorage: solo no se recuerda la sala */
    }
  }, [activaId])

  // Al cambiar de sala: sus documentos y su conversación.
  useEffect(() => {
    if (activaId == null) return
    setDocumentos([])
    setMensajes([])
    api.documentos(activaId).then(setDocumentos).catch((e) => avisar(e.message))
    api.mensajes(activaId).then(setMensajes).catch((e) => avisar(e.message))
  }, [activaId, avisar])

  // Mientras haya PDFs procesándose, se consulta su estado cada 2 segundos.
  const hayProcesando = documentos.some((d) => d.estado === 'procesando')
  useEffect(() => {
    if (!hayProcesando || activaId == null) return
    const intervalo = window.setInterval(async () => {
      const lista = await api.documentos(activaId).catch(() => null)
      if (!lista) return
      setDocumentos(lista)
      if (!lista.some((d) => d.estado === 'procesando')) cargarSalas()
    }, 2000)
    return () => window.clearInterval(intervalo)
  }, [hayProcesando, activaId, cargarSalas])

  async function subir(archivos: File[]) {
    if (activaId == null) return
    const pdfs = archivos.filter((a) => a.type === 'application/pdf' || a.name.toLowerCase().endsWith('.pdf'))
    if (pdfs.length < archivos.length) avisar('Solo se pueden subir PDFs; el resto se ignoró.')
    for (const archivo of pdfs) {
      try {
        const doc = await api.subirDocumento(activaId, archivo)
        setDocumentos((ds) => [...ds, doc])
      } catch (e) {
        avisar(`${archivo.name}: ${(e as Error).message}`)
      }
    }
    cargarSalas()
  }

  async function borrarDocumento(doc: Documento) {
    if (!window.confirm(`¿Quitar “${doc.nombre}” de la sala? El chat ya no va a poder usarlo.`)) return
    try {
      await api.borrarDocumento(doc.id)
      setDocumentos((ds) => ds.filter((d) => d.id !== doc.id))
      cargarSalas()
    } catch (e) {
      avisar((e as Error).message)
    }
  }

  async function borrarSala() {
    if (!activa) return
    if (!window.confirm(`¿Borrar la sala “${activa.nombre}” con todos sus apuntes y su conversación?`)) return
    try {
      await api.borrarSala(activa.id)
      setActivaId(null)
      await cargarSalas()
      avisar(`Sala “${activa.nombre}” borrada`)
    } catch (e) {
      avisar((e as Error).message)
    }
  }

  async function preguntar(pregunta: string) {
    if (activaId == null) return
    const sala = activaId
    const temporal: MensajeVista = {
      id: -Date.now(),
      rol: 'usuario',
      contenido: pregunta,
      fuentes: null,
      modelo: null,
      creado_en: new Date().toISOString(),
    }
    setMensajes((ms) => [...ms, temporal])
    setEsperando(true)
    try {
      const r = await api.preguntar(sala, pregunta)
      if (sala !== activaId) return
      setMensajes((ms) => [
        ...ms,
        {
          id: -Date.now() - 1,
          rol: 'asistente',
          contenido: r.respuesta,
          fuentes: r.fuentes,
          modelo: r.modelo,
          creado_en: new Date().toISOString(),
        },
      ])
    } catch (e) {
      setMensajes((ms) => [
        ...ms,
        { ...temporal, id: -Date.now() - 1, rol: 'asistente', contenido: (e as Error).message, error: true },
      ])
    } finally {
      setEsperando(false)
    }
  }

  async function limpiarChat() {
    if (activaId == null) return
    try {
      await api.borrarMensajes(activaId)
      setMensajes([])
    } catch (e) {
      avisar((e as Error).message)
    }
  }

  function elegirSala(id: number) {
    setActivaId(id)
    setCajon(null)
  }

  const barra = (
    <BarraSalas
      salas={salas ?? []}
      activaId={activaId}
      alElegir={elegirSala}
      alCrear={() => (setCajon(null), setModal('crear'))}
    />
  )
  const panel = activa && (
    <PanelDocumentos
      sala={activa}
      documentos={documentos}
      info={info}
      alSubir={subir}
      alBorrarDocumento={borrarDocumento}
      alEditarSala={() => setModal('editar')}
      alBorrarSala={borrarSala}
    />
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-panel/90 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCajon('salas')}
            aria-label="Ver salas"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 md:hidden"
          >
            <ListIcon size={20} />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500">
            <BrainIcon size={18} weight="bold" className="text-white" />
          </span>
          <span className="text-base font-bold tracking-tight text-white">Salas de Estudio</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {info && <EstadoModelo info={info} />}
          <button
            onClick={() => setModal('info')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300 hover:bg-slate-700"
          >
            <InfoIcon size={16} className="text-indigo-400" />
            <span className="hidden sm:inline">Cómo funciona</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex">{barra}</div>
        {panel && <div className="hidden lg:flex">{panel}</div>}

        {errorCarga ? (
          <Vacio titulo="No se pudo cargar" texto={errorCarga}>
            <button onClick={cargarSalas} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Reintentar
            </button>
          </Vacio>
        ) : salas === null ? (
          <Vacio titulo="Cargando…" />
        ) : !activa ? (
          <Vacio
            titulo="Creá tu primera sala"
            texto="Una sala por materia: subís los apuntes y chateás con un asistente que responde citando tus PDFs."
          >
            <button onClick={() => setModal('crear')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Crear sala
            </button>
          </Vacio>
        ) : (
          <Chat
            sala={activa}
            mensajes={mensajes}
            documentosListos={documentos.filter((d) => d.estado === 'listo').length}
            procesando={hayProcesando}
            esperando={esperando}
            alPreguntar={preguntar}
            alLimpiar={limpiarChat}
            alVerDocumentos={() => setCajon('documentos')}
          />
        )}
      </div>

      {cajon && (
        <div className="fixed inset-0 z-40 flex bg-black/60" onMouseDown={(e) => e.target === e.currentTarget && setCajon(null)}>
          <div className={`h-full ${cajon === 'salas' ? 'md:hidden' : 'lg:hidden'}`}>{cajon === 'salas' ? barra : panel}</div>
        </div>
      )}

      {modal === 'crear' && (
        <ModalSala
          alCerrar={() => setModal(null)}
          alGuardar={async (datos) => {
            const sala = await api.crearSala(datos)
            await cargarSalas()
            setActivaId(sala.id)
            setModal(null)
          }}
        />
      )}
      {modal === 'editar' && activa && (
        <ModalSala
          sala={activa}
          alCerrar={() => setModal(null)}
          alGuardar={async (datos) => {
            await api.editarSala(activa.id, datos)
            await cargarSalas()
            setModal(null)
          }}
        />
      )}
      {modal === 'info' && <ModalInfo info={info} alCerrar={() => setModal(null)} />}

      {aviso && (
        <div role="status" className="fixed right-6 bottom-6 z-50 max-w-sm rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white shadow-2xl">
          {aviso}
        </div>
      )}
    </div>
  )
}

function EstadoModelo({ info }: { info: Info }) {
  const principal = info.llm_disponibles[0]
  if (!principal)
    return (
      <span className="hidden items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-rose-400 md:flex">
        Sin modelo disponible
      </span>
    )
  const modelo = principal === 'claude' ? info.modelo_claude : info.modelo_gemini
  return (
    <span
      className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-400 md:flex"
      title={info.llm_disponibles.length > 1 ? 'Si falla, responde el siguiente proveedor' : undefined}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      Responde {nombreModelo(modelo)}
      {info.llm_disponibles.length > 1 && <span className="text-emerald-400/60">(respaldo: Gemini)</span>}
    </span>
  )
}

function Vacio({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <h2 className="text-base font-semibold text-white">{titulo}</h2>
      {texto && <p className="mt-1 max-w-md text-sm text-slate-400">{texto}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
