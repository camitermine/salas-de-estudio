import type { Color } from './api'

// Clases completas (no armadas con strings) para que Tailwind las detecte.
export const PUNTO: Record<Color, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
}

export const COLORES = Object.keys(PUNTO) as Color[]

export const NOMBRE_COLOR: Record<Color, string> = {
  indigo: 'Índigo',
  emerald: 'Verde',
  amber: 'Ámbar',
  rose: 'Rosa',
  cyan: 'Celeste',
  purple: 'Violeta',
}

export function tamano(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function nombreModelo(modelo: string | null): string {
  if (!modelo) return 'Asistente'
  if (modelo.startsWith('claude-haiku')) return 'Claude Haiku'
  if (modelo.startsWith('claude-sonnet')) return 'Claude Sonnet'
  if (modelo.startsWith('claude-opus')) return 'Claude Opus'
  if (modelo.startsWith('gemini')) return 'Gemini'
  return modelo
}

export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForma}`
}
