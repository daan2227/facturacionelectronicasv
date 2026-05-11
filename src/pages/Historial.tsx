import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const TIPO: Record<string, string> = {
  '01': 'Factura', '03': 'CF', '05': 'N.Créd', '06': 'N.Déb',
}

const ESTADO_COLOR: Record<string, string> = {
  emitido: 'text-green-600 bg-green-50',
  borrador: 'text-amber-600 bg-amber-50',
  anulado: 'text-red-600 bg-red-50',
}

export default function Historial() {
  const { data: docs, isLoading } = useQuery({
    queryKey: ['documentos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      return data ?? []
    },
  })

  if (isLoading) return <div className="text-center py-10 text-gray-400">Cargando...</div>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Historial</h1>
      {!docs?.length && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-2">📄</p>
          <p>No hay documentos emitidos aún</p>
        </div>
      )}
      {docs?.map((doc) => (
        <div key={doc.id} className="card flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{TIPO[doc.tipo_dte] ?? doc.tipo_dte}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[doc.estado] ?? ''}`}>
                {doc.estado}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{doc.numero_control}</p>
            <p className="text-xs text-gray-400">
              {doc.fecha_emision ? format(new Date(doc.fecha_emision), 'dd/MM/yyyy') : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-800">${(doc.total_pagar ?? 0).toFixed(2)}</p>
            {doc.sello_recepcion && (
              <span className="text-xs text-green-600">✓ Sellado</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
