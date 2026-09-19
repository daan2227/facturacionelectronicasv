import type { LineItem, InvoiceTotals } from '../types/invoice'

export const IVA_RATE = 0.13
export const RETENCION_RATE = 0.01

export function calcTotals(items: LineItem[], esGranContribuyente: boolean): InvoiceTotals {
  const totalGravada = round2(items.reduce((acc, i) => acc + i.ventaGravada, 0))
  const totalExenta = round2(items.reduce((acc, i) => acc + i.ventaExenta, 0))
  const totalNoSuj = round2(items.reduce((acc, i) => acc + i.ventaNoSuj, 0))
  const totalDescu = round2(items.reduce((acc, i) => acc + i.montoDescu, 0))

  const iva = round2(totalGravada * IVA_RATE)
  const retencion1 = esGranContribuyente ? round2(totalGravada * RETENCION_RATE) : 0
  const montoTotal = round2(totalGravada + totalExenta + totalNoSuj + iva)
  const totalPagar = round2(montoTotal - retencion1)

  return {
    totalGravada,
    totalExenta,
    totalNoSuj,
    totalDescu,
    iva,
    retencion1,
    montoTotal,
    totalPagar,
    totalLetras: montoToLetras(totalPagar),
  }
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// ─── Conversión de monto a letras (dólares, requerido por Hacienda) ────────────
const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE',
  'DIECIOCHO', 'DIECINUEVE']
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function centenas(n: number): string {
  if (n === 100) return 'CIEN'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const cent = c ? CENTENAS[c] + ' ' : ''
  if (resto < 20) return (cent + UNIDADES[resto]).trim()
  const d = Math.floor(resto / 10)
  const u = resto % 10
  return (cent + DECENAS[d] + (u ? ' Y ' + UNIDADES[u] : '')).trim()
}

function miles(n: number): string {
  if (n === 0) return ''
  const m = Math.floor(n / 1000)
  const resto = n % 1000
  const prefijo = m === 1 ? 'MIL' : centenas(m) + ' MIL'
  return (prefijo + (resto ? ' ' + centenas(resto) : '')).trim()
}

export function montoToLetras(monto: number): string {
  if (monto === 0) return 'CERO 00/100 DÓLARES'
  const entero = Math.floor(monto)
  const centavos = Math.round((monto - entero) * 100)
  const centStr = String(centavos).padStart(2, '0')
  const letras = entero < 1000 ? centenas(entero) : miles(entero)
  return `${letras} ${centStr}/100 DÓLARES`
}

// ─── Validaciones NIT / DUI ───────────────────────────────────────────────────
export function validarNIT(nit: string): boolean {
  const clean = nit.replace(/[-\s]/g, '')
  if (clean.length !== 14) return false
  if (!/^\d{14}$/.test(clean)) return false

  const digits = clean.split('').map(Number)

  // El Salvador uses two algorithms depending on taxpayer type:
  // Persona Natural (first digit = 0): first factor = 2
  // Persona Jurídica / company (first digit != 0): first factor = 3
  const f0 = digits[0] === 0 ? 2 : 3
  const factors = [f0, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

  const sum = digits.slice(0, 13).reduce((acc, d, i) => acc + d * factors[i], 0)
  const mod = sum % 11
  // mod=0 → dv=0, mod=1 → dv=1, mod>1 → dv=11-mod
  const dv = mod > 1 ? 11 - mod : mod

  return dv === digits[13]
}

export function validarDUI(dui: string): boolean {
  const clean = dui.replace(/[-\s]/g, '')
  if (!/^\d{9}$/.test(clean)) return false
  const factors = [8, 7, 6, 5, 4, 3, 2]
  const sum = clean.slice(0, 7).split('').reduce((acc, d, i) => acc + parseInt(d) * factors[i], 0)
  const dv = (10 - (sum % 10)) % 10
  return dv === parseInt(clean[8])
}

export function formatNRC(nrc: string): string {
  const clean = nrc.replace(/\D/g, '')
  return clean.length > 1 ? clean.slice(0, -1) + '-' + clean.slice(-1) : clean
}
