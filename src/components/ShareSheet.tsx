import { useState } from 'react'
import { sharePDF, downloadPDF } from '../lib/pdfShare'

interface Props {
  blob: Blob
  filename: string
  receptor: string
  correoReceptor?: string
  total: number
  tipoDte: string
  numeroControl: string
  onClose: () => void
}

const TIPO_LABEL: Record<string, string> = {
  '01': 'Factura', '03': 'Crédito Fiscal', '05': 'Nota de Crédito', '06': 'Nota de Débito',
}

export default function ShareSheet({ blob, filename, receptor, correoReceptor, total, tipoDte, numeroControl, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const tipoLabel = TIPO_LABEL[tipoDte] ?? tipoDte

  const resumen = [
    `🧾 *${tipoLabel}*`,
    `Cliente: ${receptor}`,
    `Total: *$${total.toFixed(2)}*`,
    `N° Control: ${numeroControl}`,
  ].join('\n')

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } finally { setBusy(false) }
  }

  // Compartir PDF con selector nativo de Android (WhatsApp, Gmail, Drive…)
  const handleShare = () => run(() =>
    sharePDF(blob, filename, `${tipoLabel} — ${receptor}`, resumen)
  )

  // Descargar PDF al dispositivo
  const handleDownload = () => run(() => downloadPDF(blob, filename))

  // WhatsApp: descarga el PDF primero, luego abre WA con texto
  const handleWhatsApp = async () => {
    setBusy(true)
    try {
      await downloadPDF(blob, filename)
      const url = `https://wa.me/?text=${encodeURIComponent(resumen + '\n\n(PDF descargado en su dispositivo)')}`
      window.open(url, '_blank')
    } finally { setBusy(false) }
  }

  // WhatsApp directo al número del cliente
  const handleWhatsAppDirect = async () => {
    const tel = prompt('Número WhatsApp del cliente (ej. 71234567):')
    if (!tel) return
    setBusy(true)
    try {
      await downloadPDF(blob, filename)
      const clean = tel.replace(/\D/g, '')
      const number = clean.startsWith('503') ? clean : `503${clean}`
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(resumen)}`, '_blank')
    } finally { setBusy(false) }
  }

  // Correo: abre app de email con datos prellenados
  const handleEmail = async () => {
    setBusy(true)
    try {
      await downloadPDF(blob, filename)
      const to = correoReceptor ? encodeURIComponent(correoReceptor) : ''
      const subject = encodeURIComponent(`${tipoLabel} — ${receptor}`)
      const body = encodeURIComponent(
        `Estimado/a cliente,\n\nAdjunto encontrará su ${tipoLabel} por $${total.toFixed(2)}.\n\n${resumen}\n\nSaludos.`
      )
      window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank')
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-2xl p-5 flex flex-col gap-4 max-w-lg mx-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />

        {/* Resumen */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✅</span>
            <span className="font-bold text-sv-blue">{tipoLabel} emitida</span>
          </div>
          <p className="font-medium text-gray-700">{receptor}</p>
          <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{numeroControl}</p>
        </div>

        <p className="text-xs text-center text-gray-400 uppercase tracking-wide font-medium">Enviar documento</p>

        {/* Acción principal: selector nativo Android */}
        <button
          onClick={handleShare}
          disabled={busy}
          className="flex items-center justify-center gap-3 bg-sv-blue text-white rounded-2xl py-4 font-semibold text-base disabled:opacity-60"
        >
          <span className="text-2xl">📤</span>
          <div className="text-left">
            <p>{busy ? 'Preparando PDF…' : 'Compartir PDF'}</p>
            <p className="text-xs opacity-75 font-normal">WhatsApp · Gmail · Drive · Telegram…</p>
          </div>
        </button>

        {/* Acciones secundarias */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleWhatsApp} disabled={busy}
            className="flex flex-col items-center gap-1 bg-green-500 text-white rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">💬</span>
            <span className="text-sm font-semibold">WhatsApp</span>
            <span className="text-xs opacity-80">Nuevo chat</span>
          </button>

          <button onClick={handleWhatsAppDirect} disabled={busy}
            className="flex flex-col items-center gap-1 bg-green-700 text-white rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">📱</span>
            <span className="text-sm font-semibold">WA directo</span>
            <span className="text-xs opacity-80">Al cliente</span>
          </button>

          <button onClick={handleEmail} disabled={busy}
            className="flex flex-col items-center gap-1 bg-gray-600 text-white rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">✉️</span>
            <span className="text-sm font-semibold">Correo</span>
            <span className="text-xs opacity-80">
              {correoReceptor ? correoReceptor.slice(0, 16) + '…' : 'Abrir email'}
            </span>
          </button>

          <button onClick={handleDownload} disabled={busy}
            className="flex flex-col items-center gap-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3 disabled:opacity-60">
            <span className="text-xl">⬇️</span>
            <span className="text-sm font-semibold">Descargar</span>
            <span className="text-xs text-gray-400">Guardar PDF</span>
          </button>
        </div>

        <button onClick={onClose} className="w-full py-3 text-gray-500 text-sm border border-gray-200 rounded-2xl">
          Listo — ir al inicio
        </button>
      </div>
    </div>
  )
}
