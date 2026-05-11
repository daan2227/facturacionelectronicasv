export type TipoDte = '01' | '03' | '04' | '05' | '06' | '11' | '14'

export interface LineItem {
  numItem: number
  tipoItem: 1 | 2 | 3 | 4
  codigo: string
  descripcion: string
  cantidad: number
  unidadMedida: number
  precioUni: number
  montoDescu: number
  ventaNoSuj: number
  ventaExenta: number
  ventaGravada: number
}

export interface Receptor {
  nombre: string
  nit?: string
  dui?: string
  nrc?: string
  giroComercial?: string
  telefono?: string
  correo?: string
  direccion?: string
  esGranContribuyente: boolean
}

export interface InvoiceTotals {
  totalGravada: number
  totalExenta: number
  totalNoSuj: number
  totalDescu: number
  iva: number
  retencion1: number
  montoTotal: number
  totalPagar: number
  totalLetras: string
}

export interface InvoiceDraft {
  codigoGeneracion: string
  tipoDte: TipoDte
  receptor: Receptor | null
  items: LineItem[]
  condicionOperacion: 1 | 2 | 3
  totals: InvoiceTotals
}

export interface DTEPayload {
  identificacion: {
    version: number
    ambiente: string
    tipoDte: TipoDte
    numeroControl: string
    codigoGeneracion: string
    tipoModelo: number
    tipoOperacion: number
    fecEmi: string
    horEmi: string
    tipoMoneda: 'USD'
  }
  emisor: {
    nit: string
    nrc: string
    nombre: string
    codActividad: string
    descActividad: string
    nombreComercial: string
    tipoEstablecimiento: string
    direccion: { departamento: string; municipio: string; complemento: string }
    telefono: string
    correo: string
  }
  receptor: Receptor
  cuerpoDocumento: LineItem[]
  resumen: InvoiceTotals & {
    subTotalVentas: number
    totalNoGravado: number
    condicionOperacion: number
  }
  selloRecepcion: string | null
}
