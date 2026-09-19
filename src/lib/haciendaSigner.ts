/**
 * Firma digital de DTEs usando JWS (RS256).
 * Requiere el certificado .p12 emitido por un PSC autorizado en El Salvador.
 */
import forge from 'node-forge'

export interface CertData {
  privateKey: forge.pki.rsa.PrivateKey
  certDerB64: string  // Certificado en DER codificado en base64 (para header x5c)
}

// ─── Base64url (sin padding, con - y _) ────────────────────────────────────
function base64url(binary: string): string {
  return forge.util.encode64(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function utf8ToBase64url(str: string): string {
  // Convierte a UTF-8 bytes y luego a base64url
  const bytes = forge.util.encodeUtf8(str)
  return base64url(bytes)
}

/**
 * Parsea un archivo .p12 y extrae la llave privada + certificado.
 * @param p12Base64 - contenido del .p12 codificado en base64
 * @param password  - contraseña del .p12
 */
export function parseCertificate(p12Base64: string, password: string): CertData {
  let p12: forge.pkcs12.Pkcs12Pfx
  try {
    const p12Der = forge.util.decode64(p12Base64)
    const p12Asn1 = forge.asn1.fromDer(p12Der)
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password)
  } catch {
    throw new Error('No se pudo abrir el certificado. Verifique la contraseña del .p12.')
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const keyBags  = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })

  const certBag = certBags[forge.pki.oids.certBag]?.[0]
  const keyBag  = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]

  if (!certBag?.cert) throw new Error('El archivo .p12 no contiene un certificado válido.')
  if (!keyBag?.key)   throw new Error('El archivo .p12 no contiene una llave privada.')

  const certDer    = forge.asn1.toDer(forge.pki.certificateToAsn1(certBag.cert)).getBytes()
  const certDerB64 = forge.util.encode64(certDer)

  return {
    privateKey: keyBag.key as forge.pki.rsa.PrivateKey,
    certDerB64,
  }
}

/**
 * Firma el JSON del DTE usando JWS compact serialization con RS256.
 * Retorna el token JWS: header.payload.signature
 */
export function signDTE(jsonDte: unknown, certData: CertData): string {
  const { privateKey, certDerB64 } = certData

  // Header JWS
  const header = JSON.stringify({ alg: 'RS256', x5c: [certDerB64] })
  const headerEnc = utf8ToBase64url(header)

  // Payload: el documento JSON serializado
  const payload = JSON.stringify(jsonDte)
  const payloadEnc = utf8ToBase64url(payload)

  // Entrada a firmar
  const signingInput = `${headerEnc}.${payloadEnc}`

  // Firma RS256 = SHA-256 + RSA PKCS#1 v1.5
  const md = forge.md.sha256.create()
  md.update(signingInput, 'utf8')
  const signatureBytes = privateKey.sign(md)
  const signatureEnc   = base64url(signatureBytes)

  return `${signingInput}.${signatureEnc}`
}

/**
 * Devuelve información legible del certificado para mostrar en UI.
 */
export function getCertInfo(p12Base64: string, password: string) {
  const { certDerB64 } = parseCertificate(p12Base64, password)
  const certDer  = forge.util.decode64(certDerB64)
  const certAsn1 = forge.asn1.fromDer(certDer)
  const cert     = forge.pki.certificateFromAsn1(certAsn1)

  const cn   = cert.subject.getField('CN')?.value ?? 'Desconocido'
  const org  = cert.subject.getField('O')?.value  ?? ''
  const from = cert.validity.notBefore
  const to   = cert.validity.notAfter
  const expired = new Date() > to

  return { cn, org, validFrom: from, validTo: to, expired }
}
