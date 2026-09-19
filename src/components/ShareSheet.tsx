import { useState } from 'react'
import { sharePDF, previewPDF, downloadPDF, downloadJSON } from '../lib/pdfShare'

interface Props {
  blob: Blob; filename: string; receptor: string; correoReceptor?: string
  total: number; tipoDte: string; numeroControl: string
  jsonDte?: unknown
  sello?: string | null
  mhEstado?: string
  mhMensaje?: string
  onClose: () => void
}

const TIPO_LABEL: Record<string, string> = {
  '01': 'Factura', '03': 'Crédito Fiscal', '05': 'Nota de Crédito', '06': 'Nota de Débito',
}

export default function ShareSheet({ blob, filename, receptor, correoReceptor, total, tipoDte, numeroControl, jsonDte, sello, mhEstado, mhMensaje, onClose }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const tipoLabel = TIPO_LABEL[tipoDte] ?? tipoDte
  const jsonFilename = filename.replace('.pdf', '-DTE.json')

  const resumen = [`🧾 *${tipoLabel}*`, `Cliente: ${receptor}`, `Total: *$${total.toFixed(2)}*`, `N° Control: ${numeroControl}`].join('\n')

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id)
    try { await fn() } catch (e) {
      const msg = (e as Error).message
      if (!msg.includes('cancel') && !msg.includes('abort')) alert(`Error: ${msg}`)
    } finally { setBusy(null) }
  }

  const mhColor = mhEstado === 'procesado' ? 'bg-green-50 border-green-300 text-green-800'
    : mhEstado === 'contingencia'           ? 'bg-amber-50 border-amber-300 text-amber-800'
    : mhEstado === 'error'                  ? 'bg-red-50 border-red-300 text-red-800'
    : ''

  const mhIcon = mhEstado === 'procesado' ? '✅' : mhEstado === 'contingencia' ? '⏳' : mhEstado === 'error' ? '❌' : ''

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl shadow-2xl p-5 flex flex-col gap-3 max-w-lg mx-auto w-full" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />

        {/* Resumen del documento */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="font-bold text-sv-blue">{tipoLabel}</p>
          <p className="font-medium text-gray-700">{receptor}</p>
          <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{numeroControl}</p>
        </div>

        {/* Estado Hacienda */}
        {mhEstado && (
          <div className={`rounded-xl px-4 py-3 border text-sm ${mhColor}`}>
            <p className="font-semibold">{mhIcon} Hacienda: {mhEstado === 'procesado' ? 'Sellado' : mhEstado === 'contingencia' ? 'En cola de contingencia' : 'Error'}</p>
            <p className="text-xs mt-0.5 opacity-80">{mhMensaje}</p>
            {sello && <p className="text-xs font-mono mt-1 break-all opacity-70">Sello: {sello.slice(0, 40)}…</p>}
          </div>
        )}

        {/* Compartir PDF */}
        <button onClick={() => run('share', () => sharePDF(blob, filename, `${tipoLabel} — ${receptor}`, resumen))}
          disabled={!!busy}
          className="flex items-center justify-center gap-3 bg-sv-blue text-white rounded-2xl py-3.5 font-semibold disabled:opacity-60">
          <span className="text-xl">📤</span>
          <div className="text-left">
            <p>{busy === 'share' ? 'Preparando…' : 'Compartir PDF'}</p>
            <p className="text-xs opacity-75 font-normal">WhatsApp · Gmail · Drive · Telegram…</p>
          </div>
        </button>

        {/* Grid de acciones */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => run('preview', () => previewPDF(blob, filename))} disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-indigo-600 text-white rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">📄</span><span className="text-xs font-semibold">{busy === 'preview' ? '…' : 'Ver PDF'}</span>
          </button>

          <button onClick={() => run('wa', async () => { await downloadPDF(blob, filename); window.open(`https://wa.me/?text=${encodeURIComponent(resumen)}`, '_blank') })} disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-green-500 text-white rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">💬</span><span className="text-xs font-semibold">{busy === 'wa' ? '…' : 'WhatsApp'}</span>
          </button>

          <button onClick={() => run('wad', async () => { const tel = prompt('Número (ej. 71234567):'); if (!tel) return; await downloadPDF(blob, filename); const n = tel.replace(/\D/g,''); window.open(`https://wa.me/${n.startsWith('503') ? n : '503'+n}?text=${encodeURIComponent(resumen)}`, '_blank') })} disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-green-700 text-white rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">📱</span><span className="text-xs font-semibold">{busy === 'wad' ? '…' : 'WA directo'}</span>
          </button>

          <button onClick={() => run('email', async () => { await downloadPDF(blob, filename); const to = correoReceptor ? encodeURIComponent(correoReceptor) : ''; window.open(`mailto:${to}?subject=${encodeURIComponent(tipoLabel+' — '+receptor)}&body=${encodeURIComponent('Estimado/a,\n\n'+resumen)}`, '_blank') })} disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-gray-600 text-white rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">✉️</span>
            <span className="text-xs font-semibold">{busy === 'email' ? '…' : 'Correo'}</span>
            {correoReceptor && <span className="text-xs opacity-70 truncate px-1 max-w-full">{correoReceptor}</span>}
          </button>

          <button onClick={() => run('dl', () => downloadPDF(blob, filename))} disabled={!!busy}
            className="flex flex-col items-center gap-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">⬇️</span><span className="text-xs font-semibold">{busy === 'dl' ? '…' : 'Bajar PDF'}</span>
          </button>

          {jsonDte && (
            <button onClick={() => run('json', () => downloadJSON(jsonDte, jsonFilename))} disabled={!!busy}
              className="flex flex-col items-center gap-1 border-2 border-orange-200 text-orange-700 rounded-2xl py-3 disabled:opacity-60">
              <span className="text-xl">📂</span><span className="text-xs font-semibold">{busy === 'json' ? '…' : 'JSON DTE'}</span>
            </button>
          )}
        </div>

        <button onClick={onClose} className="w-full py-2.5 text-gray-500 text-sm border border-gray-200 rounded-2xl">
          Listo — ir al inicio
        </button>
      </div>
    </div>
  )
}
