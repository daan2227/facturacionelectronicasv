import { useState } from 'react'
import { sharePDF, previewPDF, downloadPDF, downloadJSON } from '../lib/pdfShare'

interface Props {
  blob: Blob
  filename: string
  receptor: string
  correoReceptor?: string
  total: number
  tipoDte: string
  numeroControl: string
  jsonDte?: unknown
  onClose: () => void
}

const TIPO_LABEL: Record<string, string> = {
  '01': 'Factura', '03': 'Crédito Fiscal', '05': 'Nota de Crédito', '06': 'Nota de Débito',
}

export default function ShareSheet({ blob, filename, receptor, correoReceptor, total, tipoDte, numeroControl, jsonDte, onClose }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const tipoLabel = TIPO_LABEL[tipoDte] ?? tipoDte
  const jsonFilename = filename.replace('.pdf', '-DTE.json')

  const resumen = [
    `🧾 *${tipoLabel}*`,
    `Cliente: ${receptor}`,
    `Total: *$${total.toFixed(2)}*`,
    `N° Control: ${numeroControl}`,
  ].join('\n')

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id)
    try { await fn() } catch (e) {
      const msg = (e as Error).message
      if (!msg.includes('cancel') && !msg.includes('abort')) alert(`Error: ${msg}`)
    } finally { setBusy(null) }
  }

  const btn = (id: string) => busy === id

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-2xl p-5 flex flex-col gap-3 max-w-lg mx-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />

        {/* Resumen del documento */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">✅</span>
            <span className="font-bold text-sv-blue">{tipoLabel} emitida</span>
          </div>
          <p className="font-medium text-gray-700">{receptor}</p>
          <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{numeroControl}</p>
        </div>

        {/* Acción principal — selector nativo */}
        <button
          onClick={() => run('share', () => sharePDF(blob, filename, `${tipoLabel} — ${receptor}`, resumen))}
          disabled={!!busy}
          className="flex items-center justify-center gap-3 bg-sv-blue text-white rounded-2xl py-3.5 font-semibold disabled:opacity-60"
        >
          <span className="text-xl">📤</span>
          <div className="text-left">
            <p>{btn('share') ? 'Preparando…' : 'Compartir PDF'}</p>
            <p className="text-xs opacity-75 font-normal">WhatsApp · Gmail · Drive · Telegram…</p>
          </div>
        </button>

        {/* Grid 3 columnas */}
        <div className="grid grid-cols-3 gap-2">

          {/* Ver PDF */}
          <button
            onClick={() => run('preview', () => previewPDF(blob, filename))}
            disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-indigo-600 text-white rounded-2xl py-3 disabled:opacity-60"
          >
            <span className="text-xl">📄</span>
            <span className="text-xs font-semibold">{btn('preview') ? '…' : 'Ver PDF'}</span>
          </button>

          {/* WhatsApp nuevo chat */}
          <button
            onClick={() => run('wa', async () => {
              await downloadPDF(blob, filename)
              const url = `https://wa.me/?text=${encodeURIComponent(resumen + '\n(PDF en sus descargas)')}`
              window.open(url, '_blank')
            })}
            disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-green-500 text-white rounded-2xl py-3 disabled:opacity-60"
          >
            <span className="text-xl">💬</span>
            <span className="text-xs font-semibold">{btn('wa') ? '…' : 'WhatsApp'}</span>
          </button>

          {/* WhatsApp directo */}
          <button
            onClick={() => run('wad', async () => {
              const tel = prompt('Número del cliente (ej. 71234567):')
              if (!tel) return
              await downloadPDF(blob, filename)
              const clean = tel.replace(/\D/g, '')
              const num = clean.startsWith('503') ? clean : `503${clean}`
              window.open(`https://wa.me/${num}?text=${encodeURIComponent(resumen)}`, '_blank')
            })}
            disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-green-700 text-white rounded-2xl py-3 disabled:opacity-60"
          >
            <span className="text-xl">📱</span>
            <span className="text-xs font-semibold">{btn('wad') ? '…' : 'WA directo'}</span>
          </button>

          {/* Correo */}
          <button
            onClick={() => run('email', async () => {
              await downloadPDF(blob, filename)
              const to = correoReceptor ? encodeURIComponent(correoReceptor) : ''
              const sub = encodeURIComponent(`${tipoLabel} — ${receptor}`)
              const body = encodeURIComponent(`Estimado/a cliente,\n\nAdjunto su ${tipoLabel} por $${total.toFixed(2)}.\n\n${resumen}`)
              window.open(`mailto:${to}?subject=${sub}&body=${body}`, '_blank')
            })}
            disabled={!!busy}
            className="flex flex-col items-center gap-1 bg-gray-600 text-white rounded-2xl py-3 disabled:opacity-60"
          >
            <span className="text-xl">✉️</span>
            <span className="text-xs font-semibold">{btn('email') ? '…' : 'Correo'}</span>
            {correoReceptor && <span className="text-xs opacity-70 max-w-full truncate px-1">{correoReceptor}</span>}
          </button>

          {/* Descargar PDF */}
          <button
            onClick={() => run('dl', () => downloadPDF(blob, filename))}
            disabled={!!busy}
            className="flex flex-col items-center gap-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3 disabled:opacity-60"
          >
            <span className="text-xl">⬇️</span>
            <span className="text-xs font-semibold">{btn('dl') ? '…' : 'Bajar PDF'}</span>
          </button>

          {/* Exportar JSON DTE */}
          {jsonDte && (
            <button
              onClick={() => run('json', () => downloadJSON(jsonDte, jsonFilename))}
              disabled={!!busy}
              className="flex flex-col items-center gap-1 border-2 border-orange-200 text-orange-700 rounded-2xl py-3 disabled:opacity-60"
            >
              <span className="text-xl">📂</span>
              <span className="text-xs font-semibold">{btn('json') ? '…' : 'JSON DTE'}</span>
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
