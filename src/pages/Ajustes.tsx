import { useEmpresaStore } from '../store/empresaStore'
import { exportBackup, importBackup } from '../lib/storage'

export default function Ajustes() {
  const { empresa, clear } = useEmpresaStore()

  const handleExport = () => {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facturasv-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
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
          alert('Archivo inválido')
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
        <p className="font-semibold">{empresa?.nombre}</p>
        <p className="text-sm text-gray-600">NIT: {empresa?.nit}</p>
        <p className="text-sm text-gray-600">NRC: {empresa?.nrc}</p>
        <p className="text-sm text-gray-600">{empresa?.giroComercial}</p>
      </div>

      {/* Backup */}
      <div className="card flex flex-col gap-3">
        <p className="font-semibold text-sm">Respaldo de datos</p>
        <p className="text-xs text-gray-500">
          Sus datos se guardan solo en este dispositivo. Exporte un respaldo regularmente.
        </p>
        <button onClick={handleExport} className="btn-primary text-sm">
          ⬇️ Exportar respaldo (.json)
        </button>
        <button onClick={handleImport} className="border border-sv-blue text-sv-blue font-semibold rounded-xl px-4 py-2 text-sm">
          ⬆️ Restaurar desde respaldo
        </button>
      </div>

      {/* Peligro */}
      <div className="card border-red-200">
        <p className="font-semibold text-sm text-red-600 mb-2">Zona de peligro</p>
        <button
          onClick={() => {
            if (confirm('¿Borrar TODOS los datos de este dispositivo? Esta acción no se puede deshacer.'))
              clear()
          }}
          className="w-full border border-red-400 text-red-500 font-semibold rounded-xl py-2 text-sm"
        >
          Borrar todos los datos
        </button>
      </div>

      <div className="text-center text-xs text-gray-300 mt-2">
        FacturaSV MVP v0.1 — Sin conexión requerida
      </div>
    </div>
  )
}
