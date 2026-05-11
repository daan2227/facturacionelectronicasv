import { useState, useMemo } from 'react'
import { getClientes, saveCliente, deleteCliente } from '../lib/storage'
import { validarNIT, validarDUI } from '../utils/taxUtils'

export default function Clientes() {
  const [clientes, setClientes] = useState(() => getClientes())
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nombre: '', nombreComercial: '', nit: '', dui: '', nrc: '',
    giroComercial: '', correo: '', telefono: '', direccion: '',
    esGranContribuyente: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() =>
    clientes.filter((c) => !search || c.nombre.toLowerCase().includes(search.toLowerCase())),
    [clientes, search]
  )

  const handleSave = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (form.nit && !validarNIT(form.nit)) e.nit = 'NIT inválido'
    if (form.dui && !validarDUI(form.dui)) e.dui = 'DUI inválido'
    if (Object.keys(e).length) { setErrors(e); return }

    saveCliente(form)
    setClientes(getClientes())
    setShowForm(false)
    setForm({ nombre: '', nombreComercial: '', nit: '', dui: '', nrc: '', giroComercial: '', correo: '', telefono: '', direccion: '', esGranContribuyente: false })
    setErrors({})
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    deleteCliente(id)
    setClientes(getClientes())
  }

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
          {([
            ['nombre', 'Nombre / Razón Social *'],
            ['nombreComercial', 'Nombre comercial'],
            ['nit', 'NIT (14 dígitos)'],
            ['dui', 'DUI (persona natural)'],
            ['nrc', 'NRC'],
            ['giroComercial', 'Giro Comercial'],
            ['correo', 'Correo'],
            ['telefono', 'Teléfono'],
            ['direccion', 'Dirección'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-gray-500">{label}</label>
              <input
                className="input-field mt-0.5"
                value={(form as Record<string, string>)[key]}
                onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((s) => ({ ...s, [key]: '' })) }}
              />
              {errors[key] && <p className="text-red-500 text-xs">{errors[key]}</p>}
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.esGranContribuyente}
              onChange={(e) => setForm((f) => ({ ...f, esGranContribuyente: e.target.checked }))} />
            Gran Contribuyente (retención 1%)
          </label>
          <button onClick={handleSave} className="btn-primary">Guardar</button>
        </div>
      )}

      <input className="input-field" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {filtered.map((c) => (
        <div key={c.id} className="card flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{c.nombre}</p>
            {c.giroComercial && <p className="text-xs text-gray-500">{c.giroComercial}</p>}
            {c.nit && <p className="text-xs text-gray-400">NIT: {c.nit}</p>}
            {c.nrc && <p className="text-xs text-gray-400">NRC: {c.nrc}</p>}
            {c.esGranContribuyente && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block mt-0.5">Gran Cont.</span>}
          </div>
          <button onClick={() => handleDelete(c.id)} className="text-red-400 text-lg leading-none flex-shrink-0">🗑️</button>
        </div>
      ))}

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-2">👥</p>
          <p>No hay clientes registrados</p>
        </div>
      )}
    </div>
  )
}
