import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const TIPO_LABEL: Record<string, string> = {
  '01': 'Factura', '03': 'Crédito Fiscal', '05': 'N. Crédito', '06': 'N. Débito',
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  const { data: stats } = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('documentos')
        .select('estado, total_pagar, tipo_dte')
        .order('created_at', { ascending: false })
        .limit(100)
      return data ?? []
    },
  })

  const emitidos = stats?.filter((d) => d.estado === 'emitido') ?? []
  const totalMes = emitidos.reduce((acc, d) => acc + (d.total_pagar ?? 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bienvenido</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPI cards */}
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

      {/* Quick actions */}
      <Link to="/nuevo" className="btn-primary text-center block">
        + Nueva Factura
      </Link>

      {/* Recent */}
      {stats && stats.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Recientes</p>
          <div className="flex flex-col gap-2">
            {stats.slice(0, 5).map((doc, i) => (
              <div key={i} className="card flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{TIPO_LABEL[doc.tipo_dte] ?? doc.tipo_dte}</p>
                  <p className="text-xs text-gray-400">{doc.estado}</p>
                </div>
                <p className="font-semibold text-gray-800">${(doc.total_pagar ?? 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
