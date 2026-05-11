import { useState, useMemo } from 'react'
import { getDocumentos, anularDocumento, type DocumentoData } from '../lib/storage'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'
import InvoicePDF from '../components/InvoicePDF'
import type { DTEPayload } from '../types/invoice'

const TIPO: Record<string, string> = {
  '01': 'Factura', '03': 'CF', '05': 'N.Créd', '06': 'N.Déb',
}
const ESTADO_COLOR: Record<string, string> = {
  emitido: 'text-green-600 bg-green-50',
  borrador: 'text-amber-600 bg-amber-50',
  anulado: 'text-red-500 bg-red-50',
}

async function redownloadPDF(doc: DocumentoData) {
  const dte = doc.jsonDte as DTEPayload
  const blob = await pdf(<InvoicePDF dte={dte} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.tipoDte}-${doc.codigoGeneracion.slice(0, 8)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Historial() {
  const [docs, setDocs] = useState(() => getDocumentos())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'emitido' | 'anulado'>('todos')

  const filtered = useMemo(() => {
    return docs
      .filter((d) => filter === 'todos' || d.estado === filter)
      .filter((d) => !search || d.receptor.toLowerCase().includes(search.toLowerCase()) || d.numeroControl.includes(search))
  }, [docs, search, filter])

  const handleAnular = (id: string) => {
    if (!confirm('¿Anular este documento?')) return
    anularDocumento(id)
    setDocs(getDocumentos())
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Historial</h1>

      <input
        className="input-field"
        placeholder="Buscar por cliente o número de control..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2">
        {(['todos', 'emitido', 'anulado'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-sv-blue text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-2">📄</p>
          <p>No hay documentos</p>
        </div>
      )}

      {filtered.map((doc) => (
        <div key={doc.id} className="card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{TIPO[doc.tipoDte] ?? doc.tipoDte}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[doc.estado]}`}>
                {doc.estado}
              </span>
            </div>
            <p className="font-bold text-gray-800">${doc.totalPagar.toFixed(2)}</p>
          </div>
          <p className="text-sm text-gray-700 font-medium">{doc.receptor}</p>
          <p className="text-xs text-gray-400">{doc.numeroControl}</p>
          <p className="text-xs text-gray-400">
            {doc.fechaEmision ? format(new Date(doc.fechaEmision), 'dd/MM/yyyy') : ''} • {doc.horaEmision}
          </p>
          {doc.iva > 0 && (
            <p className="text-xs text-gray-500">IVA: ${doc.iva.toFixed(2)}{doc.retencion1pct > 0 ? ` • Ret. 1%: -$${doc.retencion1pct.toFixed(2)}` : ''}</p>
          )}
          <div className="flex gap-2 mt-1">
            {doc.jsonDte && (
              <button
                onClick={() => redownloadPDF(doc)}
                className="flex-1 text-xs border border-sv-blue text-sv-blue rounded-lg py-1.5"
              >
                ⬇️ Descargar PDF
              </button>
            )}
            {doc.estado === 'emitido' && (
              <button
                onClick={() => handleAnular(doc.id)}
                className="flex-1 text-xs border border-red-400 text-red-500 rounded-lg py-1.5"
              >
                Anular
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
