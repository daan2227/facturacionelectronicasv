import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import TipoDteSelector from '../components/TipoDteSelector'
import ReceptorForm from '../components/ReceptorForm'
import ItemsForm from '../components/ItemsForm'
import TotalesSummary from '../components/TotalesSummary'
import InvoicePDF from '../components/InvoicePDF'
import { useInvoiceStore } from '../store/invoiceStore'
import { supabase } from '../lib/supabase'
import type { DTEPayload } from '../types/invoice'

const STEPS = ['Documento', 'Cliente', 'Ítems', 'Resumen']

export default function NuevoDocumento() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const { draft, resetDraft } = useInvoiceStore()
  const navigate = useNavigate()

  const buildDTE = (): DTEPayload => {
    const now = new Date()
    return {
      identificacion: {
        version: 3,
        ambiente: '00',
        tipoDte: draft.tipoDte,
        numeroControl: `DTE-${draft.tipoDte}-C0010000-${String(Date.now()).slice(-12)}`,
        codigoGeneracion: draft.codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        fecEmi: format(now, 'yyyy-MM-dd'),
        horEmi: format(now, 'HH:mm:ss'),
        tipoMoneda: 'USD',
      },
      emisor: {
        nit: '00000000000000',
        nrc: '0000000-0',
        nombre: 'Mi Empresa S.A. de C.V.',
        codActividad: '4711',
        descActividad: 'Venta al por menor',
        nombreComercial: 'Mi Empresa',
        tipoEstablecimiento: '01',
        direccion: { departamento: '06', municipio: '14', complemento: 'San Salvador' },
        telefono: '0000-0000',
        correo: 'facturacion@miempresa.com',
      },
      receptor: draft.receptor!,
      cuerpoDocumento: draft.items,
      resumen: {
        ...draft.totals,
        subTotalVentas: draft.totals.totalGravada + draft.totals.totalExenta,
        totalNoGravado: 0,
        condicionOperacion: draft.condicionOperacion,
      },
      selloRecepcion: null,
    }
  }

  const handleEmitir = async () => {
    setLoading(true)
    try {
      const dte = buildDTE()

      // Generate PDF blob
      const blob = await pdf(<InvoicePDF dte={dte} />).toBlob()

      // Save to Supabase
      const { data: empresa } = await supabase.from('empresas').select('id').single()
      if (empresa) {
        await supabase.from('documentos').insert({
          empresa_id: empresa.id,
          cliente_id: null,
          tipo_dte: dte.identificacion.tipoDte,
          numero_control: dte.identificacion.numeroControl,
          codigo_generacion: dte.identificacion.codigoGeneracion,
          estado: 'emitido',
          ambiente: '00',
          fecha_emision: dte.identificacion.fecEmi,
          hora_emision: dte.identificacion.horEmi,
          condicion_operacion: draft.condicionOperacion,
          total_gravada: draft.totals.totalGravada,
          total_exenta: draft.totals.totalExenta,
          total_no_suj: draft.totals.totalNoSuj,
          iva: draft.totals.iva,
          retencion_1pct: draft.totals.retencion1,
          total_pagar: draft.totals.totalPagar,
          total_letras: draft.totals.totalLetras,
          json_dte: dte as unknown as Record<string, unknown>,
        })
      }

      // Download PDF
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${dte.identificacion.tipoDte}-${dte.identificacion.codigoGeneracion.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      resetDraft()
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className={`h-1.5 w-full rounded-full transition-colors ${
              i <= step ? 'bg-sv-blue' : 'bg-gray-200'
            }`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 0 && <TipoDteSelector onNext={() => setStep(1)} />}
      {step === 1 && <ReceptorForm onNext={() => setStep(2)} />}
      {step === 2 && <ItemsForm onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <TotalesSummary />
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm">← Atrás</button>
            <button
              onClick={handleEmitir}
              disabled={loading}
              className="flex-1 btn-primary bg-green-600"
            >
              {loading ? 'Generando PDF...' : '✅ Emitir y Descargar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
