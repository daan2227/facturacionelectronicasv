import { Link } from 'react-router-dom'
import { useEmpresaStore } from '../store/empresaStore'
import { getDocumentos } from '../lib/storage'
import { useMemo } from 'react'

const TIPO: Record<string, string> = {
  '01': 'Factura', '03': 'Crédito Fiscal', '05': 'N. Crédito', '06': 'N. Débito',
}

const ESTADO_COLOR: Record<string, string> = {
  emitido: 'text-green-600', borrador: 'text-amber-500', anulado: 'text-red-400 line-through',
}

export default function Dashboard() {
  const empresa = useEmpresaStore((s) => s.empresa)
  const docs = useMemo(() => getDocumentos(), [])

  const emitidos = docs.filter((d) => d.estado === 'emitido')
  const totalMes = emitidos.reduce((acc, d) => acc + d.totalPagar, 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {empresa?.nombreComercial || empresa?.nombre}
        </h1>
        <p className="text-xs text-gray-400">NIT: {empresa?.nit} • NRC: {empresa?.nrc}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-gray-500">Documentos emitidos</p>
          <p className="text-3xl font-bold text-sv-blue">{emitidos.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Total facturado</p>
          <p className="text-2xl font-bold text-green-600">${totalMes.toFixed(2)}</p>
        </div>
      </div>

      <Link to="/nuevo" className="btn-primary text-center block text-base py-3">
        + Nueva Factura
      </Link>

      {docs.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Recientes</p>
          <div className="flex flex-col gap-2">
            {docs.slice(0, 5).map((doc) => (
              <div key={doc.id} className="card flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{TIPO[doc.tipoDte] ?? doc.tipoDte}</p>
                  <p className="text-xs text-gray-400">{doc.receptor}</p>
                  <p className={`text-xs ${ESTADO_COLOR[doc.estado]}`}>{doc.estado}</p>
                </div>
                <p className="font-bold text-gray-800">${doc.totalPagar.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {docs.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-5xl mb-3">📱</p>
          <p className="font-medium">Aún no hay documentos</p>
          <p className="text-sm">Toca “+ Nueva Factura” para empezar</p>
        </div>
      )}
    </div>
  )
}
