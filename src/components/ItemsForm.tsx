import { useState } from 'react'
import { useInvoiceStore } from '../store/invoiceStore'
import type { LineItem } from '../types/invoice'

const emptyItem = (): Omit<LineItem, 'numItem'> => ({
  tipoItem: 1,
  codigo: '',
  descripcion: '',
  cantidad: 1,
  unidadMedida: 59,
  precioUni: 0,
  montoDescu: 0,
  ventaNoSuj: 0,
  ventaExenta: 0,
  ventaGravada: 0,
})

function calcGravada(item: Omit<LineItem, 'numItem'>) {
  return Math.max(0, item.cantidad * item.precioUni - item.montoDescu)
}

export default function ItemsForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, addItem, removeItem } = useInvoiceStore()
  const [form, setForm] = useState(emptyItem())
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!form.descripcion.trim()) { setError('Ingrese descripción'); return }
    if (form.precioUni <= 0) { setError('Precio debe ser mayor a 0'); return }
    const item = { ...form, ventaGravada: calcGravada(form) }
    addItem(item)
    setForm(emptyItem())
    setError('')
  }

  const num = (field: keyof typeof form, label: string) => (
    <div className="flex-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        className="input-field mt-0.5"
        value={(form[field] as number) || ''}
        onChange={(e) => {
          const val = parseFloat(e.target.value) || 0
          setForm((f) => ({ ...f, [field]: val }))
        }}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-gray-800">Artículos / Servicios</h2>

      {/* Existing items */}
      {draft.items.map((item) => (
        <div key={item.numItem} className="card flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.descripcion}</p>
            <p className="text-xs text-gray-500">{item.cantidad} × ${item.precioUni.toFixed(2)} = <strong>${item.ventaGravada.toFixed(2)}</strong></p>
          </div>
          <button
            onClick={() => removeItem(item.numItem)}
            className="text-red-500 text-xl leading-none flex-shrink-0"
          >×</button>
        </div>
      ))}

      {/* Add item form */}
      <div className="card flex flex-col gap-2 border-dashed border-sv-blue">
        <input
          className="input-field"
          placeholder="Descripción del producto / servicio *"
          value={form.descripcion}
          onChange={(e) => { setForm((f) => ({ ...f, descripcion: e.target.value })); setError('') }}
        />
        <input
          className="input-field"
          placeholder="Código (opcional)"
          value={form.codigo}
          onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
        />
        <div className="flex gap-2">
          {num('cantidad', 'Cantidad')}
          {num('precioUni', 'Precio unitario $')}
          {num('montoDescu', 'Descuento $')}
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="button"
          onClick={handleAdd}
          className="w-full border-2 border-sv-blue text-sv-blue font-semibold rounded-xl py-2 text-sm"
        >+ Agregar ítem</button>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm">← Atrás</button>
        <button
          onClick={() => { if (draft.items.length === 0) { setError('Agregue al menos un ítem'); return } onNext() }}
          className="flex-1 btn-primary"
        >Continuar →</button>
      </div>
    </div>
  )
}
