import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { validarNIT, validarDUI } from '../utils/taxUtils'

export default function Clientes() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', nit: '', nrc: '', giro_comercial: '', correo: '', telefono: '', es_gran_contribuyente: false })

  const { data: clientes } = useQuery({
    queryKey: ['clientes', search],
    queryFn: async () => {
      let q = supabase.from('clientes').select('*').order('nombre')
      if (search) q = q.ilike('nombre', `%${search}%`)
      const { data } = await q.limit(30)
      return data ?? []
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      const { data: empresa } = await supabase.from('empresas').select('id').single()
      if (!empresa) throw new Error('Configure su empresa primero')
      const { error } = await supabase.from('clientes').insert({ ...form, empresa_id: empresa.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      setShowForm(false)
      setForm({ nombre: '', nit: '', nrc: '', giro_comercial: '', correo: '', telefono: '', es_gran_contribuyente: false })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-3 py-1.5">
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <div className="card flex flex-col gap-3">
          <h2 className="font-semibold text-sm">Nuevo cliente</h2>
          {([
            ['nombre', 'Nombre *', 'text'],
            ['nit', 'NIT (14 dígitos)', 'text'],
            ['nrc', 'NRC', 'text'],
            ['giro_comercial', 'Giro Comercial', 'text'],
            ['correo', 'Correo', 'email'],
            ['telefono', 'Teléfono', 'tel'],
          ] as const).map(([key, label, type]) => (
            <div key={key}>
              <label className="text-xs text-gray-500">{label}</label>
              <input
                type={type}
                className="input-field mt-0.5"
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.es_gran_contribuyente}
              onChange={(e) => setForm((f) => ({ ...f, es_gran_contribuyente: e.target.checked }))}
            />
            Gran Contribuyente
          </label>
          <button onClick={() => save.mutate()} disabled={!form.nombre || save.isPending} className="btn-primary">
            {save.isPending ? 'Guardando...' : 'Guardar'}
          </button>
          {save.isError && <p className="text-red-500 text-xs">{(save.error as Error).message}</p>}
        </div>
      )}

      <input
        className="input-field"
        placeholder="Buscar clientes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        {clientes?.map((c) => (
          <div key={c.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{c.nombre}</p>
                {c.giro_comercial && <p className="text-xs text-gray-500">{c.giro_comercial}</p>}
                {c.nit && <p className="text-xs text-gray-400">NIT: {c.nit}</p>}
                {c.nrc && <p className="text-xs text-gray-400">NRC: {c.nrc}</p>}
              </div>
              {c.es_gran_contribuyente && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Gran Cont.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
