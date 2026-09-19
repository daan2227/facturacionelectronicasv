import { useInvoiceStore } from '../store/invoiceStore'

const TIPO_DTE_LABEL: Record<string, string> = {
  '01': 'Factura Consumidor Final',
  '03': 'Crédito Fiscal',
  '04': 'Nota de Remisión',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '11': 'Factura de Exportación',
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm py-1 border-b border-gray-100 last:border-0 ${
      bold ? 'font-bold text-base text-sv-blue' : ''
    }`}>
      <span className={bold ? '' : 'text-gray-600'}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function TotalesSummary() {
  const { draft } = useInvoiceStore()
  const { totals, receptor, tipoDte } = draft

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <p className="text-xs text-gray-500 mb-1">Documento</p>
        <p className="font-semibold">{TIPO_DTE_LABEL[tipoDte] ?? tipoDte}</p>
        {receptor && <p className="text-sm text-gray-600 mt-0.5">{receptor.nombre}</p>}
        {receptor?.esGranContribuyente && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1 inline-block">
            Gran Contribuyente — Retención 1%
          </span>
        )}
      </div>

      <div className="card">
        <p className="text-xs text-gray-500 mb-2">Resumen financiero</p>
        {totals.totalGravada > 0 && <Row label="Ventas gravadas" value={`$${totals.totalGravada.toFixed(2)}`} />}
        {totals.totalExenta > 0 && <Row label="Ventas exentas" value={`$${totals.totalExenta.toFixed(2)}`} />}
        {totals.totalNoSuj > 0 && <Row label="No sujetas" value={`$${totals.totalNoSuj.toFixed(2)}`} />}
        {totals.totalDescu > 0 && <Row label="Descuentos" value={`-$${totals.totalDescu.toFixed(2)}`} />}
        <Row label="IVA (13%)" value={`$${totals.iva.toFixed(2)}`} />
        {totals.retencion1 > 0 && <Row label="Retención 1%" value={`-$${totals.retencion1.toFixed(2)}`} />}
        <Row label="TOTAL A PAGAR" value={`$${totals.totalPagar.toFixed(2)}`} bold />
      </div>

      <div className="card bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">Monto en letras</p>
        <p className="text-sm font-medium leading-snug">{totals.totalLetras}</p>
      </div>
    </div>
  )
}
