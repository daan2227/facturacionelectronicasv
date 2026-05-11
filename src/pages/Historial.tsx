import { useState, useMemo } from 'react'
import { getDocumentos, anularDocumento, type DocumentoData } from '../lib/storage'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'
import InvoicePDF from '../components/InvoicePDF'
import ShareSheet from '../components/ShareSheet'
import type { DTEPayload } from '../types/invoice'

const TIPO: Record<string, string> = {
  '01': 'Factura', '03': 'CF', '05': 'N.Créd', '06': 'N.Déb',
}
const ESTADO_COLOR: Record<string, string> = {
  emitido: 'text-green-600 bg-green-50',
  borrador: 'text-amber-600 bg-amber-50',
  anulado: 'text-red-500 bg-red-50',
}

export default function Historial() {
  const [docs, setDocs] = useState(() => getDocumentos())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'emitido' | 'anulado'>('todos')
  const [sharing, setSharing] = useState<{ doc: DocumentoData; blob: Blob } | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return docs
      .filter((d) => filter === 'todos' || d.estado === filter)
      .filter((d) => !search || d.receptor.toLowerCase().includes(search.toLowerCase()) || d.numeroControl.includes(search))
  }, [docs, search, filter])

  const handleShare = async (doc: DocumentoData) => {
    if (!doc.jsonDte) return
    setGeneratingId(doc.id)
    try {
      const blob = await pdf(<InvoicePDF dte={doc.jsonDte as DTEPayload} />).toBlob()
      setSharing({ doc, blob })
    } finally {
      setGeneratingId(null)
    }
  }

  const handleAnular = (id: string) => {
    if (!confirm('¿Anular este documento?')) return
    anularDocumento(id)
    setDocs(getDocumentos())
  }

  return (
    <>
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
            <p className="text-xs text-gray-400 font-mono">{doc.numeroControl}</p>
            <p className="text-xs text-gray-400">
              {doc.fechaEmision ? format(new Date(doc.fechaEmision), 'dd/MM/yyyy') : ''} • {doc.horaEmision}
            </p>
            {doc.iva > 0 && (
              <p className="text-xs text-gray-500">
                IVA: ${doc.iva.toFixed(2)}
                {doc.retencion1pct > 0 && ` • Ret. 1%: -$${doc.retencion1pct.toFixed(2)}`}
              </p>
            )}

            <div className="flex gap-2 mt-1">
              {/* Botón compartir */}
              {doc.jsonDte && doc.estado !== 'anulado' && (
                <button
                  onClick={() => handleShare(doc)}
                  disabled={generatingId === doc.id}
                  className="flex-1 bg-sv-blue text-white text-xs rounded-xl py-2 font-medium flex items-center justify-center gap-1"
                >
                  {generatingId === doc.id ? (
                    <span>Preparando…</span>
                  ) : (
                    <><span>📤</span> Compartir / Enviar</>
                  )}
                </button>
              )}

              {/* Anular */}
              {doc.estado === 'emitido' && (
                <button
                  onClick={() => handleAnular(doc.id)}
                  className="text-xs border border-red-300 text-red-500 rounded-xl px-3 py-2"
                >
                  Anular
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Panel de compartir desde historial */}
      {sharing && (
        <ShareSheet
          blob={sharing.blob}
          filename={`${sharing.doc.tipoDte}-${sharing.doc.codigoGeneracion.slice(0, 8)}.pdf`}
          receptor={sharing.doc.receptor}
          total={sharing.doc.totalPagar}
          tipoDte={sharing.doc.tipoDte}
          numeroControl={sharing.doc.numeroControl}
          onClose={() => setSharing(null)}
        />
      )}
    </>
  )
}
