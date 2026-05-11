import { useState } from 'react'

interface ShareSheetProps {
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

export default function ShareSheet({
  blob, filename, receptor, correoReceptor, total, tipoDte, numeroControl, onClose,
}: ShareSheetProps) {
  const [sharing, setSharing] = useState(false)
  const tipoLabel = TIPO_LABEL[tipoDte] ?? tipoDte
  const canShareFiles = !!(navigator.share && navigator.canShare)

  const resumenTexto = [
    `📄 *${tipoLabel}*`,
    `Cliente: ${receptor}`,
    `Total: *$${total.toFixed(2)}*`,
    `N° Control: ${numeroControl}`,
    `Emitida por FacturaSV`,
  ].join('\n')

  // Compartir el archivo PDF via selector nativo de Android
  const handleShareFile = async () => {
    setSharing(true)
    try {
      const file = new File([blob], filename, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${tipoLabel} - ${receptor}`,
          text: resumenTexto,
          files: [file],
        })
      } else {
        // Fallback: solo texto + descargar el archivo
        await navigator.share({ title: `${tipoLabel} - ${receptor}`, text: resumenTexto })
        handleDownload()
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') handleDownload()
    } finally {
      setSharing(false)
    }
  }

  // WhatsApp: envía el texto; el usuario adjunta el PDF desde su galería/descargas
  const handleWhatsApp = () => {
    handleDownload() // descarga primero para que el usuario tenga el PDF
    const url = `https://wa.me/?text=${encodeURIComponent(resumenTexto + '\n\n(PDF adjunto descargado en su dispositivo)')}`
    window.open(url, '_blank')
  }

  // WhatsApp a número específico del receptor
  const handleWhatsAppDirect = (tel: string) => {
    const clean = tel.replace(/\D/g, '')
    const number = clean.startsWith('503') ? clean : `503${clean}`
    handleDownload()
    const url = `https://wa.me/${number}?text=${encodeURIComponent(resumenTexto)}`
    window.open(url, '_blank')
  }

  // Email: abre app de correo con datos prellenados
  const handleEmail = () => {
    const subject = encodeURIComponent(`${tipoLabel} - ${receptor}`)
    const body = encodeURIComponent(
      `Estimado/a cliente,\n\nAdjunto encontrará su ${tipoLabel} por un total de $${total.toFixed(2)}.\n\n${resumenTexto}\n\nSaludos,`
    )
    const to = correoReceptor ? encodeURIComponent(correoReceptor) : ''
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank')
    // El PDF se descarga para que el usuario lo adjunte manualmente
    handleDownload()
  }

  // Descarga directa del PDF
  const handleDownload = () => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    // Overlay oscuro
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      {/* Panel inferior */}
      <div
        className="bg-white rounded-t-3xl shadow-2xl p-5 flex flex-col gap-4 max-w-lg mx-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Indicador de arrastre */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />

        {/* Resumen del documento */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✅</span>
            <span className="font-bold text-sv-blue text-lg">{tipoLabel} emitida</span>
          </div>
          <p className="text-sm text-gray-700 font-medium">{receptor}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">${total.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{numeroControl}</p>
        </div>

        <p className="text-xs text-gray-500 text-center font-medium uppercase tracking-wide">Compartir documento</p>

        {/* Botones de compartir */}
        <div className="grid grid-cols-2 gap-3">
          {/* Compartir nativo (WhatsApp, Gmail, Drive, etc.) */}
          {canShareFiles && (
            <button
              onClick={handleShareFile}
              disabled={sharing}
              className="flex flex-col items-center gap-1.5 bg-sv-blue text-white rounded-2xl py-4 px-3 col-span-2"
            >
              <span className="text-2xl">📤</span>
              <span className="font-semibold text-sm">
                {sharing ? 'Preparando...' : 'Compartir PDF'}
              </span>
              <span className="text-xs opacity-75">WhatsApp · Gmail · Drive · etc.</span>
            </button>
          )}

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-1.5 bg-green-500 text-white rounded-2xl py-4 px-3"
          >
            <span className="text-2xl">💬</span>
            <span className="font-semibold text-sm">WhatsApp</span>
            <span className="text-xs opacity-80">Texto + PDF</span>
          </button>

          {/* Correo */}
          <button
            onClick={handleEmail}
            className="flex flex-col items-center gap-1.5 bg-gray-700 text-white rounded-2xl py-4 px-3"
          >
            <span className="text-2xl">✉️</span>
            <span className="font-semibold text-sm">Correo</span>
            <span className="text-xs opacity-80">
              {correoReceptor ? correoReceptor.slice(0, 18) + '…' : 'Abrir email'}
            </span>
          </button>

          {/* Descargar PDF */}
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1.5 border-2 border-gray-200 text-gray-700 rounded-2xl py-4 px-3"
          >
            <span className="text-2xl">⬇️</span>
            <span className="font-semibold text-sm">Descargar</span>
            <span className="text-xs text-gray-400">Guardar PDF</span>
          </button>

          {/* WhatsApp a número del receptor (si tiene teléfono) */}
          <button
            onClick={() => {
              const tel = prompt('Número WhatsApp del cliente (ej. 71234567):')
              if (tel) handleWhatsAppDirect(tel)
            }}
            className="flex flex-col items-center gap-1.5 border-2 border-green-200 text-green-700 rounded-2xl py-4 px-3"
          >
            <span className="text-2xl">📱</span>
            <span className="font-semibold text-sm">WA directo</span>
            <span className="text-xs text-gray-400">Al número del cliente</span>
          </button>
        </div>

        {/* Cerrar */}
        <button
          onClick={onClose}
          className="w-full py-3 text-gray-500 text-sm font-medium border border-gray-200 rounded-2xl"
        >
          Listo — ir al inicio
        </button>
      </div>
    </div>
  )
}
