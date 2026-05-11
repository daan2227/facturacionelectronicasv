/**
 * Descarga o comparte un PDF de forma nativa en Android (Capacitor)
 * o via blob URL en el navegador web.
 */
import { Capacitor } from '@capacitor/core'

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // result = "data:application/pdf;base64,AAAA..."
      resolve(result.split(',')[1])
    }
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
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Descarga directa: al dispositivo en web, al almacenamiento en Android */
export async function downloadPDF(blob: Blob, filename: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    webDownload(blob, filename)
    return
  }

  // Android nativo: escribe en caché y abre con app del sistema
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const base64 = await blobToBase64(blob)
  await Filesystem.writeFile({
    path: `facturasv/${filename}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })
}

/** Selector nativo de Android (WhatsApp, Gmail, Drive, etc.) */
export async function sharePDF(blob: Blob, filename: string, title: string, text: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Web: usar Web Share API con archivo
    try {
      const file = new File([blob], filename, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text, files: [file] })
        return
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
    // Fallback si Web Share no soporta archivos
    webDownload(blob, filename)
    return
  }

  // Android nativo: escribe archivo y abre selector de apps
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')

  const base64 = await blobToBase64(blob)
  const result = await Filesystem.writeFile({
    path: `facturasv/${filename}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })

  await Share.share({
    title,
    text,
    url: result.uri,
    dialogTitle: 'Compartir factura',
  })
}
