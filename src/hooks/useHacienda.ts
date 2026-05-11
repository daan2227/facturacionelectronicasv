import { useState, useCallback } from 'react'
import { parseCertificate, signDTE } from '../lib/haciendaSigner'
import { authenticate, submitDTE } from '../lib/haciendaApi'
import { getMHCredentials, saveMHTokenCache, addPendingDTE, updateDocumentoSello } from '../lib/storage'
import { useEmpresaStore } from '../store/empresaStore'

export interface HaciendaResult {
  sello:   string | null
  estado:  'procesado' | 'contingencia' | 'error'
  mensaje: string
}

/** Cache del token en memoria para evitar autenticar en cada DTE */
let tokenCache: { token: string; expiresAt: number } | null = null

async function getToken(nit: string, password: string, ambiente: '00' | '01'): Promise<string> {
  // Usar caché si el token expira en más de 60 segundos
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token
  }
  const token = await authenticate(nit, password, ambiente)
  // Los tokens de MH duran ~1 hora — guardamos con 55 minutos de vida
  tokenCache = { token, expiresAt: Date.now() + 55 * 60 * 1000 }
  saveMHTokenCache(tokenCache)
  return token
}

/**
 * Hook principal para el flujo completo de emisión DTE ante Hacienda:
 * 1. Firma el JSON con JWS (certificado .p12)
 * 2. Autentica con la API MH
 * 3. Envía el DTE firmado
 * 4. Guarda el sello de recepción
 * 5. Si falla: encola en contingencia para reintento manual
 */
export function useHacienda() {
  const empresa = useEmpresaStore((s) => s.empresa)
  const [loading, setLoading] = useState(false)

  const emitirDTE = useCallback(async (
    jsonDte:          unknown,
    documentoId:      string,
    tipoDte:          string,
    codigoGeneracion: string,
  ): Promise<HaciendaResult> => {
    const creds = getMHCredentials()

    if (!creds?.certBase64 || !creds?.passwordMH) {
      return {
        sello:   null,
        estado:  'contingencia',
        mensaje: 'Credenciales MH no configuradas. Configure el certificado en Ajustes.',
      }
    }

    setLoading(true)
    let jwsToken: string | null = null

    try {
      // 1. Firmar con el certificado .p12
      const certData = parseCertificate(creds.certBase64, creds.certPassword)
      jwsToken = signDTE(jsonDte, certData)

      // 2. Obtener token JWT de Hacienda
      const authToken = await getToken(
        empresa!.nit,
        creds.passwordMH,
        empresa!.ambiente ?? '00',
      )

      // 3. Enviar DTE a la API
      const respuesta = await submitDTE(
        jwsToken,
        tipoDte,
        codigoGeneracion,
        authToken,
        empresa!.ambiente ?? '00',
      )

      if (respuesta.estado === 'PROCESADO' && respuesta.selloRecepcion) {
        // 4. Guardar sello en el documento local
        updateDocumentoSello(documentoId, respuesta.selloRecepcion)
        return {
          sello:   respuesta.selloRecepcion,
          estado:  'procesado',
          mensaje: 'Documento sellado y procesado por Hacienda.',
        }
      }

      if (respuesta.estado === 'CONTINGENCIA') {
        addPendingDTE(documentoId, jwsToken, tipoDte, codigoGeneracion)
        return {
          sello:   null,
          estado:  'contingencia',
          mensaje: 'Hacienda en modo contingencia. El DTE fue encolado para reintento automático.',
        }
      }

      // RECHAZADO
      const obs = respuesta.observaciones?.join(' | ') ?? ''
      throw new Error(respuesta.descripcionMsg ?? `Estado: ${respuesta.estado}. ${obs}`)

    } catch (e) {
      const mensaje = (e as Error).message
      // Encolar para reintento si hubo error de red y tenemos el JWS
      if (jwsToken && (mensaje.includes('fetch') || mensaje.includes('timeout') || mensaje.includes('network'))) {
        addPendingDTE(documentoId, jwsToken, tipoDte, codigoGeneracion)
        return {
          sello:   null,
          estado:  'contingencia',
          mensaje: `Sin conexión con Hacienda. DTE encolado: ${mensaje}`,
        }
      }
      return { sello: null, estado: 'error', mensaje }
    } finally {
      setLoading(false)
    }
  }, [empresa])

  return { emitirDTE, loading }
}
