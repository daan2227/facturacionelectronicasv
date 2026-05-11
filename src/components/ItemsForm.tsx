import { useState } from 'react'
import { useInvoiceStore } from '../store/invoiceStore'
import type { LineItem } from '../types/invoice'

const IVA = 0.13
const round2 = (n: number) => Math.round(n * 100) / 100

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

export default function ItemsForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, addItem, removeItem } = useInvoiceStore()
  const [form, setForm] = useState(emptyItem())
  const [error, setError] = useState('')
  // Toggle: true = el precio ingresado YA incluye IVA
  const [precioConIVA, setPrecioConIVA] = useState(false)

  // Precio efectivo que verá el cliente final (con IVA)
  const precioFinal = precioConIVA
    ? form.precioUni
    : round2(form.precioUni * (1 + IVA))

  // Venta gravada neta (sin IVA) — es lo que va al DTE
  function calcGravada() {
    const bruto = form.cantidad * form.precioUni - form.montoDescu
    return round2(precioConIVA ? bruto / (1 + IVA) : bruto)
  }

  const handleAdd = () => {
    if (!form.descripcion.trim()) { setError('Ingrese descripción'); return }
    if (form.precioUni <= 0)      { setError('Precio debe ser mayor a 0'); return }
    addItem({ ...form, ventaGravada: calcGravada() })
    setForm(emptyItem())
    setError('')
  }

  const numField = (field: keyof typeof form, label: string) => (
    <div className="flex-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number" min="0" step="0.01"
        className="input-field mt-0.5"
        value={(form[field] as number) || ''}
        onChange={(e) => setForm((f) => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-gray-800">Artículos / Servicios</h2>

      {/* Ítems ya agregados */}
      {draft.items.map((item) => (
        <div key={item.numItem} className="card flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.descripcion}</p>
            <p className="text-xs text-gray-500">
              {item.cantidad} × ${item.precioUni.toFixed(2)}
              {' '}→ neto: <strong>${item.ventaGravada.toFixed(2)}</strong>
              {' '}| c/IVA: <strong>${round2(item.ventaGravada * 1.13).toFixed(2)}</strong>
            </p>
          </div>
          <button onClick={() => removeItem(item.numItem)} className="text-red-400 text-2xl leading-none">×</button>
        </div>
      ))}

      {/* Formulario nuevo ítem */}
      <div className="card flex flex-col gap-3 border-dashed border-sv-blue">

        {/* Toggle precio con/sin IVA */}
        <label className="flex items-center gap-2 text-sm bg-amber-50 rounded-xl px-3 py-2">
          <input
            type="checkbox"
            checked={precioConIVA}
            onChange={(e) => setPrecioConIVA(e.target.checked)}
            className="w-4 h-4 accent-amber-500"
          />
          <span>
            <span className="font-semibold">Precio ya incluye IVA</span>
            <span className="text-gray-500 text-xs ml-1">(el sistema calcula el neto)</span>
          </span>
        </label>

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
          {numField('cantidad', 'Cantidad')}
          <div className="flex-1">
            <label className="text-xs text-gray-500">
              {precioConIVA ? 'Precio c/IVA $' : 'Precio s/IVA $'}
            </label>
            <input
              type="number" min="0" step="0.01"
              className="input-field mt-0.5"
              value={form.precioUni || ''}
              onChange={(e) => setForm((f) => ({ ...f, precioUni: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          {numField('montoDescu', 'Descuento $')}
        </div>

        {/* Vista previa de precios */}
        {form.precioUni > 0 && (
          <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600 flex justify-between">
            <span>Neto (sin IVA): <strong>${round2(
              precioConIVA ? form.precioUni / 1.13 : form.precioUni
            ).toFixed(2)}</strong></span>
            <span>IVA 13%: <strong>${round2(
              precioConIVA
                ? form.precioUni - form.precioUni / 1.13
                : form.precioUni * 0.13
            ).toFixed(2)}</strong></span>
            <span>Total c/IVA: <strong>${precioFinal.toFixed(2)}</strong></span>
          </div>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="button" onClick={handleAdd}
          className="w-full border-2 border-sv-blue text-sv-blue font-semibold rounded-xl py-2 text-sm"
        >
          + Agregar ítem
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm">← Atrás</button>
        <button
          onClick={() => { if (!draft.items.length) { setError('Agregue al menos un ítem'); return } onNext() }}
          className="flex-1 btn-primary"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
