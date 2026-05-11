import { useInvoiceStore } from '../store/invoiceStore'
import type { TipoDte } from '../types/invoice'

const TIPOS: { value: TipoDte; label: string; desc: string }[] = [
  { value: '01', label: 'Factura', desc: 'Consumidor Final' },
  { value: '03', label: 'Crédito Fiscal', desc: 'Contribuyentes con NIT/NRC' },
  { value: '05', label: 'Nota de Crédito', desc: 'Corrección a Crédito Fiscal' },
  { value: '06', label: 'Nota de Débito', desc: 'Cargo adicional' },
]

export default function TipoDteSelector({ onNext }: { onNext: () => void }) {
  const { draft, setTipoDte } = useInvoiceStore()

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800">Tipo de documento</h2>
      {TIPOS.map((t) => (
        <button
          key={t.value}
          onClick={() => { setTipoDte(t.value); onNext() }}
          className={`card text-left flex items-center justify-between transition-all ${
            draft.tipoDte === t.value
              ? 'border-sv-blue border-2 bg-blue-50'
              : 'hover:border-gray-300'
          }`}
        >
          <div>
            <p className="font-semibold text-gray-900">{t.label}</p>
            <p className="text-xs text-gray-500">{t.desc}</p>
          </div>
          <span className="text-sv-blue text-lg">{draft.tipoDte === t.value ? '✓' : '›'}</span>
        </button>
      ))}
    </div>
  )
}
