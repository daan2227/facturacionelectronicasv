import { v4 as uuidv4 } from 'uuid'

const PREFIX = 'fsv_'
function read<T>(key: string): T | null {
  try { const r = localStorage.getItem(PREFIX + key); return r ? JSON.parse(r) as T : null }
  catch { return null }
}
function write<T>(key: string, v: T) { localStorage.setItem(PREFIX + key, JSON.stringify(v)) }

// ─── Empresa ──────────────────────────────────────────────────
export interface EmpresaData {
  id: string; nit: string; nrc: string; nombre: string; nombreComercial: string
  giroComercial: string; codActividad: string; descActividad: string
  tipoEstablecimiento: string; departamento: string; municipio: string
  direccion: string; telefono: string; correo: string
  esGranContribuyente: boolean; correlativoActual: number
  ambiente: '00' | '01'
}
export function getEmpresa(): EmpresaData | null {
  const d = read<EmpresaData>('empresa')
  return d ? { ambiente: '00', ...d } : null
}
export function saveEmpresa(data: Omit<EmpresaData, 'id' | 'correlativoActual'>): EmpresaData {
  const e = getEmpresa()
  const empresa: EmpresaData = { id: e?.id ?? uuidv4(), correlativoActual: e?.correlativoActual ?? 1, ...data }
  write('empresa', empresa); return empresa
}
export function nextNumeroControl(tipoDte: string): string {
  const empresa = getEmpresa()
  if (!empresa) throw new Error('Empresa no configurada')
  const n = empresa.correlativoActual
  empresa.correlativoActual += 1
  write('empresa', empresa)
  return `DTE-${tipoDte}-C0010000-${String(n).padStart(15, '0')}`
}

// ─── Credenciales MH ───────────────────────────────────────────────
export interface MHCredentials {
  passwordMH:   string    // Contraseña del portal api.mh.gob.sv
  certBase64:   string    // Archivo .p12 codificado en base64
  certPassword: string    // Contraseña del .p12
  tokenCache?:  { token: string; expiresAt: number }
}
export function getMHCredentials(): MHCredentials | null { return read<MHCredentials>('mh_creds') }
export function saveMHCredentials(data: Omit<MHCredentials, 'tokenCache'>): void {
  const existing = getMHCredentials()
  write('mh_creds', { ...data, tokenCache: existing?.tokenCache })
}
export function saveMHTokenCache(cache: { token: string; expiresAt: number }): void {
  const creds = getMHCredentials()
  if (creds) write('mh_creds', { ...creds, tokenCache: cache })
}
export function clearMHCredentials(): void { localStorage.removeItem(PREFIX + 'mh_creds') }

// ─── Cola de contingencia ─────────────────────────────────────────────
export interface PendingDTE {
  id:               string
  createdAt:        string
  documentoId:      string
  jwsToken:         string   // Ya está firmado, listo para enviar
  tipoDte:          string
  codigoGeneracion: string
  intentos:         number
  ultimoError:      string | null
}
export function getPendingDTEs(): PendingDTE[] { return read<PendingDTE[]>('pending_dtes') ?? [] }
export function addPendingDTE(
  documentoId: string, jwsToken: string, tipoDte: string, codigoGeneracion: string
): void {
  const pending = getPendingDTEs()
  pending.push({ id: uuidv4(), createdAt: new Date().toISOString(), documentoId, jwsToken, tipoDte, codigoGeneracion, intentos: 0, ultimoError: null })
  write('pending_dtes', pending)
}
export function updatePendingDTE(id: string, changes: Partial<PendingDTE>): void {
  write('pending_dtes', getPendingDTEs().map((p) => p.id === id ? { ...p, ...changes } : p))
}
export function removePendingDTE(id: string): void {
  write('pending_dtes', getPendingDTEs().filter((p) => p.id !== id))
}

// ─── Clientes ────────────────────────────────────────────────
export interface ClienteData {
  id: string; createdAt: string; nombre: string; nombreComercial: string
  nit: string; dui: string; nrc: string; giroComercial: string
  telefono: string; correo: string; direccion: string; esGranContribuyente: boolean
}
export function getClientes(): ClienteData[] { return read<ClienteData[]>('clientes') ?? [] }
export function saveCliente(data: Omit<ClienteData, 'id' | 'createdAt'>): ClienteData {
  const clientes = getClientes()
  const c: ClienteData = { id: uuidv4(), createdAt: new Date().toISOString(), ...data }
  clientes.push(c); write('clientes', clientes); return c
}
export function deleteCliente(id: string): void {
  write('clientes', getClientes().filter((c) => c.id !== id))
}

// ─── Documentos ────────────────────────────────────────────────
export interface DocumentoData {
  id: string; createdAt: string; tipoDte: string; numeroControl: string
  codigoGeneracion: string; selloRecepcion: string | null
  estado: 'borrador' | 'emitido' | 'anulado'
  fechaEmision: string; horaEmision: string; condicionOperacion: number
  receptor: string; totalGravada: number; totalExenta: number; totalNoSuj: number
  iva: number; retencion1pct: number; totalPagar: number; totalLetras: string
  jsonDte: unknown
}
export function getDocumentos(): DocumentoData[] { return read<DocumentoData[]>('documentos') ?? [] }
export function saveDocumento(data: Omit<DocumentoData, 'id' | 'createdAt'>): DocumentoData {
  const docs = getDocumentos()
  const doc: DocumentoData = { id: uuidv4(), createdAt: new Date().toISOString(), ...data }
  docs.unshift(doc); write('documentos', docs); return doc
}
export function updateDocumentoSello(id: string, sello: string): void {
  write('documentos', getDocumentos().map((d) =>
    d.id === id ? { ...d, selloRecepcion: sello } : d
  ))
}
export function anularDocumento(id: string): void {
  write('documentos', getDocumentos().map((d) =>
    d.id === id ? { ...d, estado: 'anulado' as const } : d
  ))
}

// ─── Backup ──────────────────────────────────────────────────
export function exportBackup(): string {
  return JSON.stringify({ empresa: getEmpresa(), clientes: getClientes(), documentos: getDocumentos(), exportedAt: new Date().toISOString() }, null, 2)
}
export function importBackup(json: string): void {
  const d = JSON.parse(json)
  if (d.empresa)   write('empresa', d.empresa)
  if (d.clientes)  write('clientes', d.clientes)
  if (d.documentos) write('documentos', d.documentos)
}
