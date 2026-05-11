import { useState } from 'react'
import { useInvoiceStore } from '../store/invoiceStore'
import { validarNIT, validarDUI, formatNRC } from '../utils/taxUtils'
import type { Receptor } from '../types/invoice'

export default function ReceptorForm({ onNext }: { onNext: () => void }) {
  const { draft, setReceptor } = useInvoiceStore()
  const [form, setForm] = useState<Receptor>(draft.receptor ?? {
    nombre: '', nit: '', nrc: '', giroComercial: '',
    telefono: '', correo: '', direccion: '', esGranContribuyente: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (form.nit && !validarNIT(form.nit)) e.nit = 'NIT inválido (14 dígitos)'
    if (!form.nit && !form.dui) e.nit = 'Ingrese NIT o DUI'
    if (form.dui && !validarDUI(form.dui)) e.dui = 'DUI inválido'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setReceptor(form)
    onNext()
  }

  const field = (key: keyof Receptor, label: string, placeholder = '') => (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        className="input-field mt-0.5"
        placeholder={placeholder}
        value={(form[key] as string) ?? ''}
        onChange={(ev) => {
          const val = key === 'nrc' ? formatNRC(ev.target.value) : ev.target.value
          setForm((f) => ({ ...f, [key]: val }))
          setErrors((er) => ({ ...er, [key]: '' }))
        }}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-0.5">{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800">Datos del cliente</h2>

      {field('nombre', 'Nombre / Razón Social *', 'Empresa S.A. de C.V.')}
      {field('nit', 'NIT (14 dígitos)', '0614-010123-101-1')}
      {field('dui', 'DUI (si persona natural)', '00000000-0')}
      {field('nrc', 'NRC', '123456-7')}
      {field('giroComercial', 'Giro Comercial', 'Venta de mercaderías')}
      {field('telefono', 'Teléfono', '2222-3333')}
      {field('correo', 'Correo electrónico', 'facturacion@cliente.com')}
      {field('direccion', 'Dirección', 'San Salvador')}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.esGranContribuyente}
          onChange={(e) => setForm((f) => ({ ...f, esGranContribuyente: e.target.checked }))}
          className="w-4 h-4"
        />
        Gran Contribuyente (retención 1%)
      </label>

      <button type="submit" className="btn-primary mt-2">Continuar →</button>
    </form>
  )
}
