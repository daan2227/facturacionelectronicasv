import { Capacitor } from '@capacitor/core'

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function webDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

async function writeToCache(blob: Blob, filename: string): Promise<string> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const base64 = await blobToBase64(blob)
  const result = await Filesystem.writeFile({
    path: `facturasv/${filename}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })
  return result.uri
}

/** Descarga un archivo al dispositivo */
export async function downloadFile(blob: Blob, filename: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    webDownload(blob, filename)
    return
  }
  // Nativo: escribe en Documents (visible en el explorador de archivos)
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const base64 = await blobToBase64(blob)
  await Filesystem.writeFile({
    path: `facturasv/${filename}`,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  })
}

/** Alias para PDF */
export const downloadPDF = (blob: Blob, filename: string) => downloadFile(blob, filename)

/** Abre el PDF en el visor nativo (Android) o en una nueva pestaña (web) */
export async function previewPDF(blob: Blob, filename: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // Revocar después de 2 minutos
    setTimeout(() => URL.revokeObjectURL(url), 120_000)
    return
  }
  // Nativo: escribe en caché y abre con app de sistema (visor PDF)
  const uri = await writeToCache(blob, filename)
  const { Share } = await import('@capacitor/share')
  await Share.share({ url: uri, dialogTitle: 'Abrir PDF con…' })
}

/** Selector nativo Android (WhatsApp, Gmail, Drive, Telegram…) con el PDF adjunto */
export async function sharePDF(blob: Blob, filename: string, title: string, text: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] })
        return
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
    webDownload(blob, filename)
    return
  }
  const uri = await writeToCache(blob, filename)
  const { Share } = await import('@capacitor/share')
  await Share.share({ title, text, url: uri, dialogTitle: 'Compartir factura' })
}

/** Descarga el JSON DTE al dispositivo */
export async function downloadJSON(obj: unknown, filename: string): Promise<void> {
  const json = JSON.stringify(obj, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  await downloadFile(blob, filename)
}
