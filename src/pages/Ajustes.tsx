import { useState } from 'react'
import { useEmpresaStore } from '../store/empresaStore'
import {
  exportBackup, importBackup,
  getMHCredentials, saveMHCredentials, clearMHCredentials,
  getPendingDTEs, removePendingDTE, updatePendingDTE,
  updateDocumentoSello,
} from '../lib/storage'
import { downloadFile } from '../lib/pdfShare'
import { getCertInfo } from '../lib/haciendaSigner'
import { authenticate, submitDTE } from '../lib/haciendaApi'

export default function Ajustes() {
  const { empresa, save, clear } = useEmpresaStore()
  const [savedMsg, setSavedMsg] = useState('')

  // MH credentials state
  const stored = getMHCredentials()
  const [passwordMH,   setPasswordMH]   = useState(stored?.passwordMH   ?? '')
  const [certPassword, setCertPassword] = useState(stored?.certPassword ?? '')
  const [certBase64,   setCertBase64]   = useState(stored?.certBase64   ?? '')
  const [certInfo,     setCertInfo]     = useState(() => {
    if (!stored?.certBase64) return null
    try { return getCertInfo(stored.certBase64, stored.certPassword) } catch { return null }
  })
  const [credError,  setCredError]  = useState('')
  const [testStatus, setTestStatus] = useState('')
  const [retrying,   setRetrying]   = useState(false)
  const [pending,    setPending]    = useState(() => getPendingDTEs())

  const notify = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3000) }

  const handleAmbiente = (a: '00' | '01') => {
    if (!empresa) return
    save({ ...empresa, ambiente: a })
    notify('Ambiente actualizado')
  }

  // Cargar certificado .p12
  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = (ev.target?.result as string).split(',')[1]
      setCertBase64(b64)
      setCertInfo(null)
      setCredError('')
    }
    reader.readAsDataURL(file)
  }

  // Validar y guardar credenciales
  const handleSaveCreds = () => {
    setCredError('')
    if (!passwordMH) { setCredError('Ingrese la contraseña MH'); return }
    if (!certBase64)  { setCredError('Cargue el archivo .p12');    return }
    if (!certPassword){ setCredError('Ingrese la contraseña del .p12'); return }
    try {
      const info = getCertInfo(certBase64, certPassword)
      if (info.expired) {
        setCredError(`⚠️ El certificado venció el ${info.validTo.toLocaleDateString('es-SV')}. Renueve con su PSC.`)
        return
      }
      setCertInfo(info)
      saveMHCredentials({ passwordMH, certBase64, certPassword })
      notify('Credenciales guardadas')
    } catch (err) {
      setCredError((err as Error).message)
    }
  }

  // Probar conexión con la API de Hacienda
  const handleTest = async () => {
    setTestStatus('Probando conexión...')
    try {
      await authenticate(empresa!.nit, passwordMH, empresa!.ambiente ?? '00')
      setTestStatus('✅ Conexión exitosa con Hacienda')
    } catch (e) {
      setTestStatus(`❌ ${(e as Error).message}`)
    }
  }

  // Reintentar DTEs en cola
  const handleRetry = async () => {
    if (!empresa) return
    setRetrying(true)
    const queue = getPendingDTEs()
    let ok = 0
    for (const item of queue) {
      try {
        const creds = getMHCredentials()!
        const token = await authenticate(empresa.nit, creds.passwordMH, empresa.ambiente ?? '00')
        const resp  = await submitDTE(item.jwsToken, item.tipoDte, item.codigoGeneracion, token, empresa.ambiente ?? '00')
        if (resp.estado === 'PROCESADO' && resp.selloRecepcion) {
          updateDocumentoSello(item.documentoId, resp.selloRecepcion)
          removePendingDTE(item.id)
          ok++
        } else {
          updatePendingDTE(item.id, { intentos: item.intentos + 1, ultimoError: resp.descripcionMsg ?? resp.estado })
        }
      } catch (e) {
        updatePendingDTE(item.id, { intentos: item.intentos + 1, ultimoError: (e as Error).message })
      }
    }
    setPending(getPendingDTEs())
    setRetrying(false)
    notify(ok > 0 ? `${ok} DTE(s) sellados con éxito` : 'No se pudieron enviar los DTEs')
  }

  const handleExport = async () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' })
    await downloadFile(blob, `facturasv-backup-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const r = new FileReader()
      r.onload = (ev) => {
        try { importBackup(ev.target?.result as string); window.location.reload() }
        catch { alert('Archivo inválido') }
      }
      r.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <h1 className="text-xl font-bold">Ajustes</h1>

      {savedMsg && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-sm px-4 py-2 rounded-xl text-center">
          {savedMsg}
        </div>
      )}

      {/* Empresa */}
      <div className="card">
        <p className="text-xs text-gray-500 mb-1">Empresa</p>
        <p className="font-bold">{empresa?.nombre}</p>
        <p className="text-sm text-gray-600">NIT: {empresa?.nit} • NRC: {empresa?.nrc}</p>
        <p className="text-sm text-gray-500">{empresa?.giroComercial}</p>
      </div>

      {/* Ambiente */}
      <div className="card">
        <p className="font-semibold text-sm mb-3">Ambiente DTE</p>
        <div className="flex gap-2">
          {(['00', '01'] as const).map((a) => (
            <button key={a} onClick={() => handleAmbiente(a)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                (empresa?.ambiente ?? '00') === a
                  ? a === '00' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-200 text-gray-400'
              }`}>
              <span className="block text-lg">{a === '00' ? '⚠️' : '✅'}</span>
              {a === '00' ? 'Pruebas' : 'Producción'}
              <span className="block text-xs mt-0.5 font-normal">
                {a === '00' ? 'Sin validez fiscal' : 'Válido ante Hacienda'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Credenciales Hacienda */}
      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Credenciales Hacienda (API MH)</p>
          {certInfo && !certInfo.expired && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Activo</span>
          )}
        </div>

        {/* Info del certificado cargado */}
        {certInfo && (
          <div className={`rounded-xl p-3 text-xs ${
            certInfo.expired ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'
          }`}>
            <p className="font-semibold">{certInfo.cn}</p>
            {certInfo.org && <p>{certInfo.org}</p>}
            <p>Válido hasta: {certInfo.validTo.toLocaleDateString('es-SV')}</p>
            {certInfo.expired && <p className="font-bold mt-1">⚠️ Certificado vencido</p>}
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500">Contraseña portal MH (api.mh.gob.sv)</label>
          <input type="password" className="input-field mt-0.5" value={passwordMH}
            onChange={(e) => setPasswordMH(e.target.value)} placeholder="Contraseña MH" />
        </div>

        <div>
          <label className="text-xs text-gray-500">Certificado digital (.p12)</label>
          <div className="flex gap-2 mt-0.5">
            <button onClick={() => document.getElementById('cert-upload')?.click()}
              className="flex-1 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-sv-blue hover:text-sv-blue transition-colors">
              {certBase64 ? '📄 Certificado cargado — cambiar' : '📤 Cargar archivo .p12'}
            </button>
            <input id="cert-upload" type="file" accept=".p12,.pfx" className="hidden" onChange={handleCertUpload} />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">Contraseña del .p12</label>
          <input type="password" className="input-field mt-0.5" value={certPassword}
            onChange={(e) => setCertPassword(e.target.value)} placeholder="Contraseña del certificado" />
        </div>

        {credError && <p className="text-red-500 text-xs">{credError}</p>}

        <div className="flex gap-2">
          <button onClick={handleSaveCreds} className="flex-1 btn-primary text-sm">
            Guardar credenciales
          </button>
          <button onClick={handleTest} disabled={!passwordMH}
            className="flex-1 border border-sv-blue text-sv-blue rounded-xl py-2 text-sm disabled:opacity-40">
            Probar conexión
          </button>
        </div>

        {testStatus && (
          <p className={`text-xs text-center ${
            testStatus.startsWith('✅') ? 'text-green-600' : testStatus.startsWith('❌') ? 'text-red-500' : 'text-gray-500'
          }`}>{testStatus}</p>
        )}

        {stored && (
          <button onClick={() => { clearMHCredentials(); setCertBase64(''); setCertInfo(null); notify('Credenciales eliminadas') }}
            className="text-xs text-red-400 text-center">
            Eliminar credenciales
          </button>
        )}
      </div>

      {/* Cola de contingencia */}
      {pending.length > 0 && (
        <div className="card border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">⏳ DTEs pendientes ({pending.length})</p>
            <button onClick={handleRetry} disabled={retrying}
              className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-xl disabled:opacity-50">
              {retrying ? 'Enviando...' : 'Reintentar todos'}
            </button>
          </div>
          {pending.map((p) => (
            <div key={p.id} className="text-xs text-gray-600 border-b border-gray-100 py-1.5">
              <span className="font-mono">{p.codigoGeneracion.slice(0, 16)}…</span>
              <span className="ml-2 text-gray-400">{p.intentos} intento(s)</span>
              {p.ultimoError && <p className="text-red-400 truncate">{p.ultimoError}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Backup */}
      <div className="card flex flex-col gap-3">
        <p className="font-semibold text-sm">Respaldo de datos</p>
        <p className="text-xs text-gray-500">Sus datos solo existen en este dispositivo. Exporte regularmente.</p>
        <button onClick={handleExport} className="btn-primary text-sm">⬇️ Exportar respaldo</button>
        <button onClick={handleImport} className="border border-sv-blue text-sv-blue font-semibold rounded-xl px-4 py-2 text-sm">⬆️ Restaurar</button>
      </div>

      {/* Zona de peligro */}
      <div className="card border-red-200">
        <p className="font-semibold text-sm text-red-600 mb-2">Zona de peligro</p>
        <button onClick={() => { if (confirm('¿Borrar TODOS los datos?')) clear() }}
          className="w-full border border-red-400 text-red-500 font-semibold rounded-xl py-2 text-sm">
          Borrar todos los datos
        </button>
      </div>

      <p className="text-center text-xs text-gray-300">FacturaSV MVP v0.1</p>
    </div>
  )
}
