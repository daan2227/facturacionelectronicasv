/**
 * Motor de almacenamiento local — reemplaza Supabase.
 */
import { v4 as uuidv4 } from 'uuid'

const PREFIX = 'fsv_'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch { return null }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

// ─── Empresa ──────────────────────────────────────────────────
export interface EmpresaData {
  id: string
  nit: string
  nrc: string
  nombre: string
  nombreComercial: string
  giroComercial: string
  codActividad: string
  descActividad: string
  tipoEstablecimiento: string
  departamento: string
  municipio: string
  direccion: string
  telefono: string
  correo: string
  esGranContribuyente: boolean
  correlativoActual: number
  ambiente: '00' | '01'
}

export function getEmpresa(): EmpresaData | null {
  const data = read<EmpresaData>('empresa')
  if (!data) return null
  return { ambiente: '00', ...data } // retrocompatibilidad
}

export function saveEmpresa(data: Omit<EmpresaData, 'id' | 'correlativoActual'>): EmpresaData {
  const existing = getEmpresa()
  const empresa: EmpresaData = {
    id: existing?.id ?? uuidv4(),
    correlativoActual: existing?.correlativoActual ?? 1,
    ...data,
  }
  write('empresa', empresa)
  return empresa
}

export function nextNumeroControl(tipoDte: string): string {
  const empresa = getEmpresa()
  if (!empresa) throw new Error('Empresa no configurada')
  const correlativo = empresa.correlativoActual
  empresa.correlativoActual += 1
  write('empresa', empresa)
  return `DTE-${tipoDte}-C0010000-${String(correlativo).padStart(15, '0')}`
}

// ─── Clientes ────────────────────────────────────────────────
export interface ClienteData {
  id: string
  createdAt: string
  nombre: string
  nombreComercial: string
  nit: string
  dui: string
  nrc: string
  giroComercial: string
  telefono: string
  correo: string
  direccion: string
  esGranContribuyente: boolean
}

export function getClientes(): ClienteData[] { return read<ClienteData[]>('clientes') ?? [] }

export function saveCliente(data: Omit<ClienteData, 'id' | 'createdAt'>): ClienteData {
  const clientes = getClientes()
  const cliente: ClienteData = { id: uuidv4(), createdAt: new Date().toISOString(), ...data }
  clientes.push(cliente)
  write('clientes', clientes)
  return cliente
}

export function deleteCliente(id: string): void {
  write('clientes', getClientes().filter((c) => c.id !== id))
}

// ─── Documentos ───────────────────────────────────────────────
export interface DocumentoData {
  id: string
  createdAt: string
  tipoDte: string
  numeroControl: string
  codigoGeneracion: string
  selloRecepcion: string | null
  estado: 'borrador' | 'emitido' | 'anulado'
  fechaEmision: string
  horaEmision: string
  condicionOperacion: number
  receptor: string
  totalGravada: number
  totalExenta: number
  totalNoSuj: number
  iva: number
  retencion1pct: number
  totalPagar: number
  totalLetras: string
  jsonDte: unknown
}

export function getDocumentos(): DocumentoData[] { return read<DocumentoData[]>('documentos') ?? [] }

export function saveDocumento(data: Omit<DocumentoData, 'id' | 'createdAt'>): DocumentoData {
  const docs = getDocumentos()
  const doc: DocumentoData = { id: uuidv4(), createdAt: new Date().toISOString(), ...data }
  docs.unshift(doc)
  write('documentos', docs)
  return doc
}

export function anularDocumento(id: string): void {
  write('documentos', getDocumentos().map((d) =>
    d.id === id ? { ...d, estado: 'anulado' as const } : d
  ))
}

// ─── Backup ───────────────────────────────────────────────────
export function exportBackup(): string {
  return JSON.stringify({
    empresa: getEmpresa(),
    clientes: getClientes(),
    documentos: getDocumentos(),
    exportedAt: new Date().toISOString(),
  }, null, 2)
}

export function importBackup(json: string): void {
  const data = JSON.parse(json)
  if (data.empresa) write('empresa', data.empresa)
  if (data.clientes) write('clientes', data.clientes)
  if (data.documentos) write('documentos', data.documentos)
}
