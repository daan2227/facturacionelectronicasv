import { useState } from 'react'
import { useEmpresaStore } from '../store/empresaStore'
import { validarNIT } from '../utils/taxUtils'

const DEPARTAMENTOS = [
  { code: '01', name: 'Ahuachapán' }, { code: '02', name: 'Santa Ana' },
  { code: '03', name: 'Sonsonate' }, { code: '04', name: 'Chalatenango' },
  { code: '05', name: 'La Libertad' }, { code: '06', name: 'San Salvador' },
  { code: '07', name: 'Cuscatlán' }, { code: '08', name: 'La Paz' },
  { code: '09', name: 'Cabañas' }, { code: '10', name: 'San Vicente' },
  { code: '11', name: 'Usulután' }, { code: '12', name: 'San Miguel' },
  { code: '13', name: 'Morazán' }, { code: '14', name: 'La Unión' },
]

export default function SetupEmpresa() {
  const save = useEmpresaStore((s) => s.save)
  const [form, setForm] = useState({
    nit: '', nrc: '', nombre: '', nombreComercial: '',
    giroComercial: '', codActividad: '', descActividad: '',
    tipoEstablecimiento: '01', departamento: '06', municipio: '14',
    direccion: '', telefono: '', correo: '', esGranContribuyente: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.nit.trim()) e.nit = 'Requerido'
    else if (!validarNIT(form.nit)) e.nit = 'NIT inválido (14 dígitos)'
    if (!form.nrc.trim()) e.nrc = 'Requerido'
    if (!form.giroComercial.trim()) e.giroComercial = 'Requerido'
    if (!form.direccion.trim()) e.direccion = 'Requerido'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    save(form)
  }

  const f = (key: keyof typeof form, label: string, placeholder = '') => (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        className="input-field mt-0.5"
        placeholder={placeholder}
        value={form[key] as string}
        onChange={(ev) => { setForm((s) => ({ ...s, [key]: ev.target.value })); setErrors((s) => ({ ...s, [key]: '' })) }}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-0.5">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-sv-blue flex flex-col items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-sv-blue">FacturaSV</h1>
          <p className="text-gray-500 text-sm mt-1">Configure su empresa para comenzar</p>
          <p className="text-xs text-gray-400 mt-0.5">Datos guardados solo en este dispositivo</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {f('nombre', 'Razón Social *', 'Mi Empresa S.A. de C.V.')}
          {f('nombreComercial', 'Nombre comercial', 'Mi Tienda')}
          {f('nit', 'NIT * (14 dígitos)', '0614-010123-101-1')}
          {f('nrc', 'NRC *', '123456-7')}
          {f('giroComercial', 'Giro comercial *', 'Venta de mercaderías')}
          {f('codActividad', 'Código de actividad', '4711')}
          {f('descActividad', 'Descripción actividad', 'Venta al por menor')}
          {f('direccion', 'Dirección *', 'San Salvador')}

          <div>
            <label className="text-xs font-medium text-gray-600">Departamento</label>
            <select
              className="input-field mt-0.5"
              value={form.departamento}
              onChange={(e) => setForm((s) => ({ ...s, departamento: e.target.value }))}
            >
              {DEPARTAMENTOS.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
          </div>

          {f('telefono', 'Teléfono', '2222-3333')}
          {f('correo', 'Correo', 'facturacion@miempresa.com')}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.esGranContribuyente}
              onChange={(e) => setForm((s) => ({ ...s, esGranContribuyente: e.target.checked }))}
              className="w-4 h-4"
            />
            Somos Gran Contribuyente
          </label>

          <button type="submit" className="btn-primary mt-2">Guardar y comenzar</button>
        </form>
      </div>
    </div>
  )
}
