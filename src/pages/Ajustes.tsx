import { useState } from 'react'
import { useEmpresaStore } from '../store/empresaStore'
import { exportBackup, importBackup } from '../lib/storage'
import { downloadFile } from '../lib/pdfShare'

export default function Ajustes() {
  const { empresa, save, clear } = useEmpresaStore()
  const [saved, setSaved] = useState(false)

  const handleAmbiente = (a: '00' | '01') => {
    if (!empresa) return
    save({ ...empresa, ambiente: a })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const filename = `facturasv-backup-${new Date().toISOString().slice(0, 10)}.json`
    await downloadFile(blob, filename)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          importBackup(ev.target?.result as string)
          window.location.reload()
        } catch {
          alert('Archivo inválido o corrupto')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900">Ajustes</h1>

      {/* Empresa */}
      <div className="card">
        <p className="text-xs text-gray-500 mb-1">Empresa configurada</p>
        <p className="font-bold">{empresa?.nombre}</p>
        <p className="text-sm text-gray-600">NIT: {empresa?.nit}</p>
        <p className="text-sm text-gray-600">NRC: {empresa?.nrc}</p>
        <p className="text-sm text-gray-600">{empresa?.giroComercial}</p>
      </div>

      {/* Ambiente DTE */}
      <div className="card">
        <p className="font-semibold text-sm mb-1">Ambiente DTE</p>
        <p className="text-xs text-gray-500 mb-3">
          Controla si los documentos son de prueba o producción oficial ante el Ministerio de Hacienda.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleAmbiente('00')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
              empresa?.ambiente === '00' || !empresa?.ambiente
                ? 'bg-amber-50 border-amber-400 text-amber-700'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            <span className="block text-lg">⚠️</span>
            Pruebas
            <span className="block text-xs mt-0.5 font-normal">Sin validez fiscal</span>
          </button>
          <button
            onClick={() => handleAmbiente('01')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
              empresa?.ambiente === '01'
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            <span className="block text-lg">✅</span>
            Producción
            <span className="block text-xs mt-0.5 font-normal">Válido ante Hacienda</span>
          </button>
        </div>
        {saved && <p className="text-green-600 text-xs mt-2 text-center">Ambiente actualizado ✓</p>}
      </div>

      {/* Backup */}
      <div className="card flex flex-col gap-3">
        <p className="font-semibold text-sm">Respaldo de datos</p>
        <p className="text-xs text-gray-500">
          Sus datos solo existen en este dispositivo. Exporte un respaldo regularmente.
        </p>
        <button onClick={handleExport} className="btn-primary text-sm">
          ⬇️ Exportar respaldo (.json)
        </button>
        <button onClick={handleImport} className="border border-sv-blue text-sv-blue font-semibold rounded-xl px-4 py-2 text-sm">
          ⬆️ Restaurar desde respaldo
        </button>
      </div>

      {/* Zona de peligro */}
      <div className="card border-red-200">
        <p className="font-semibold text-sm text-red-600 mb-2">Zona de peligro</p>
        <button
          onClick={() => {
            if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.'))
              clear()
          }}
          className="w-full border border-red-400 text-red-500 font-semibold rounded-xl py-2 text-sm"
        >
          Borrar todos los datos
        </button>
      </div>

      <p className="text-center text-xs text-gray-300">FacturaSV MVP v0.1</p>
    </div>
  )
}
