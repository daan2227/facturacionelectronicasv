/**
 * Cliente REST para la API de Documentos Tributarios Electrónicos
 * del Ministerio de Hacienda de El Salvador.
 *
 * Pruebas:    https://apifact.mh.gob.sv
 * Producción: https://apidte.mh.gob.sv
 */

const API_BASE: Record<string, string> = {
  '00': 'https://apifact.mh.gob.sv',
  '01': 'https://apidte.mh.gob.sv',
}

// ─── Tipos de respuesta MH ─────────────────────────────────────────────────
export interface MHAuthResponse {
  status: string
  body?: { token: string; tokenType: string }
  mensaje?: string
}

export interface MHRecepcionResponse {
  version:          number
  ambiente:         string
  versionApp:       number
  estado:           'PROCESADO' | 'RECHAZADO' | 'CONTINGENCIA'
  codigoGeneracion: string
  selloRecepcion?:  string
  fhProcesamiento?: string
  clasificaMsg?:    string
  codigoMsg?:       string
  descripcionMsg?:  string
  observaciones?:   string[]
}

export interface MHConsultaResponse {
  estado:          string
  selloRecepcion?: string
  documento?:      unknown
}

// ─── Helper fetch con timeout ──────────────────────────────────────────────
async function apiFetch<T>(url: string, options: RequestInit, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json() as Promise<T>
  } catch (e) {
    clearTimeout(timer)
    if ((e as Error).name === 'AbortError') throw new Error('Tiempo de espera agotado (API Hacienda)')
    throw e
  }
}

/**
 * Obtiene el JWT de autenticación de la API de Hacienda.
 * @param nit       NIT del emisor (sin guiones)
 * @param password  Contraseña registrada en el portal MH
 * @param ambiente  '00' = pruebas | '01' = producción
 */
export async function authenticate(
  nit: string,
  password: string,
  ambiente: '00' | '01',
): Promise<string> {
  const data = await apiFetch<MHAuthResponse>(
    `${API_BASE[ambiente]}/seguridad/auth`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: nit, pwd: password }),
    },
  )
  if (data.status !== 'OK' || !data.body?.token) {
    throw new Error(data.mensaje ?? 'Error de autenticación con Hacienda')
  }
  return data.body.token
}

/**
 * Envía el DTE firmado (JWS) a la API de Hacienda.
 * @returns selloRecepcion si fue PROCESADO
 */
export async function submitDTE(
  jwsToken:         string,
  tipoDte:          string,
  codigoGeneracion: string,
  authToken:        string,
  ambiente:         '00' | '01',
): Promise<MHRecepcionResponse> {
  return apiFetch<MHRecepcionResponse>(
    `${API_BASE[ambiente]}/fe/recepciondte`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({
        ambiente,
        idEnvio:          Date.now(),
        version:          1,
        tipoDte,
        documento:        jwsToken,
        codigoGeneracion,
      }),
    },
  )
}

/**
 * Consulta el estado de un DTE por su código de generación.
 */
export async function queryDTE(
  codigoGeneracion: string,
  authToken:        string,
  ambiente:         '00' | '01',
): Promise<MHConsultaResponse> {
  return apiFetch<MHConsultaResponse>(
    `${API_BASE[ambiente]}/fe/consultadte/${codigoGeneracion}`,
    { headers: { 'Authorization': authToken } },
  )
}
