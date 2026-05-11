import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import TipoDteSelector from '../components/TipoDteSelector'
import ReceptorForm from '../components/ReceptorForm'
import ItemsForm from '../components/ItemsForm'
import TotalesSummary from '../components/TotalesSummary'
import InvoicePDF from '../components/InvoicePDF'
import ShareSheet from '../components/ShareSheet'
import { useInvoiceStore } from '../store/invoiceStore'
import { useEmpresaStore } from '../store/empresaStore'
import { saveDocumento, nextNumeroControl } from '../lib/storage'
import type { DTEPayload } from '../types/invoice'

const STEPS = ['Documento', 'Cliente', 'Ítems', 'Resumen']

interface EmitidoData {
  blob: Blob
  filename: string
  receptor: string
  correoReceptor?: string
  total: number
  tipoDte: string
  numeroControl: string
}

export default function NuevoDocumento() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [emitido, setEmitido] = useState<EmitidoData | null>(null)
  const { draft, resetDraft } = useInvoiceStore()
  const empresa = useEmpresaStore((s) => s.empresa!)
  const navigate = useNavigate()

  const buildDTE = (numeroControl: string): DTEPayload => {
    const now = new Date()
    return {
      identificacion: {
        version: 3,
        ambiente: '00',
        tipoDte: draft.tipoDte,
        numeroControl,
        codigoGeneracion: draft.codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        fecEmi: format(now, 'yyyy-MM-dd'),
        horEmi: format(now, 'HH:mm:ss'),
        tipoMoneda: 'USD',
      },
      emisor: {
        nit: empresa.nit,
        nrc: empresa.nrc,
        nombre: empresa.nombre,
        codActividad: empresa.codActividad || '0000',
        descActividad: empresa.descActividad || empresa.giroComercial,
        nombreComercial: empresa.nombreComercial || empresa.nombre,
        tipoEstablecimiento: empresa.tipoEstablecimiento,
        direccion: {
          departamento: empresa.departamento,
          municipio: empresa.municipio,
          complemento: empresa.direccion,
        },
        telefono: empresa.telefono,
        correo: empresa.correo,
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
      const numeroControl = nextNumeroControl(draft.tipoDte)
      const dte = buildDTE(numeroControl)

      // Guardar en localStorage
      saveDocumento({
        tipoDte: dte.identificacion.tipoDte,
        numeroControl: dte.identificacion.numeroControl,
        codigoGeneracion: dte.identificacion.codigoGeneracion,
        selloRecepcion: null,
        estado: 'emitido',
        fechaEmision: dte.identificacion.fecEmi,
        horaEmision: dte.identificacion.horEmi,
        condicionOperacion: draft.condicionOperacion,
        receptor: draft.receptor?.nombre ?? '',
        totalGravada: draft.totals.totalGravada,
        totalExenta: draft.totals.totalExenta,
        totalNoSuj: draft.totals.totalNoSuj,
        iva: draft.totals.iva,
        retencion1pct: draft.totals.retencion1,
        totalPagar: draft.totals.totalPagar,
        totalLetras: draft.totals.totalLetras,
        jsonDte: dte,
      })

      // Generar PDF como blob
      const blob = await pdf(<InvoicePDF dte={dte} />).toBlob()
      const filename = `${dte.identificacion.tipoDte}-${dte.identificacion.codigoGeneracion.slice(0, 8)}.pdf`

      // Mostrar panel de compartir
      setEmitido({
        blob,
        filename,
        receptor: draft.receptor?.nombre ?? '',
        correoReceptor: draft.receptor?.correo,
        total: draft.totals.totalPagar,
        tipoDte: draft.tipoDte,
        numeroControl,
      })

      resetDraft()
    } finally {
      setLoading(false)
    }
  }

  const handleCloseShare = () => {
    setEmitido(null)
    navigate('/')
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Barra de progreso */}
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

        {step === 0 && <TipoDteSelector onNext={() => setStep(1)} />}
        {step === 1 && <ReceptorForm onNext={() => setStep(2)} />}
        {step === 2 && <ItemsForm onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <TotalesSummary />
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm">
                ← Atrás
              </button>
              <button onClick={handleEmitir} disabled={loading} className="flex-1 btn-primary bg-green-600">
                {loading ? 'Generando PDF...' : '✅ Emitir'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel de compartir — aparece al emitir */}
      {emitido && <ShareSheet {...emitido} onClose={handleCloseShare} />}
    </>
  )
}
