import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { DTEPayload } from '../types/invoice'
import { format } from 'date-fns'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2' },
  ],
})

const s = StyleSheet.create({
  page: { fontSize: 9, padding: 32, fontFamily: 'Helvetica', color: '#111' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#0F3F8C' },
  subtitle: { fontSize: 8, color: '#555' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontWeight: 'bold', color: '#0F3F8C', textTransform: 'uppercase', marginBottom: 4, borderBottom: '1px solid #0F3F8C', paddingBottom: 2 },
  row: { flexDirection: 'row', gap: 4 },
  col: { flex: 1 },
  label: { fontSize: 7, color: '#888' },
  value: { fontSize: 8.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0F3F8C', color: 'white', padding: '4 6', fontSize: 7.5, fontWeight: 'bold', borderRadius: 2 },
  tableRow: { flexDirection: 'row', padding: '3 6', borderBottom: '0.5px solid #e5e7eb' },
  tableRowAlt: { flexDirection: 'row', padding: '3 6', backgroundColor: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' },
  totalsBox: { marginTop: 8, alignSelf: 'flex-end', width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '2 4' },
  totalsRowBold: { flexDirection: 'row', justifyContent: 'space-between', padding: '3 4', backgroundColor: '#0F3F8C', color: 'white', borderRadius: 2, marginTop: 2 },
  letrasBox: { marginTop: 8, padding: 6, backgroundColor: '#f0f4ff', borderRadius: 4 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#999' },
  codigoBox: { marginTop: 10, padding: 6, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 7.5 },
})

const $f = (n: number) => `$${n.toFixed(2)}`

export default function InvoicePDF({ dte }: { dte: DTEPayload }) {
  const { identificacion: id, emisor, receptor, cuerpoDocumento: items, resumen } = dte
  const TIPO_LABEL: Record<string, string> = {
    '01': 'FACTURA', '03': 'CRÉDITO FISCAL', '05': 'NOTA DE CRÉDITO', '06': 'NOTA DE DÉBITO',
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>{emisor.nombreComercial || emisor.nombre}</Text>
            <Text style={s.subtitle}>{emisor.nombre}</Text>
            <Text style={s.subtitle}>NIT: {emisor.nit} • NRC: {emisor.nrc}</Text>
            <Text style={s.subtitle}>{emisor.descActividad}</Text>
            <Text style={s.subtitle}>{emisor.direccion.complemento}</Text>
            <Text style={s.subtitle}>Tel: {emisor.telefono} • {emisor.correo}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F3F8C' }}>{TIPO_LABEL[id.tipoDte] ?? id.tipoDte}</Text>
            <Text style={s.subtitle}>Número de control:</Text>
            <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{id.numeroControl}</Text>
            <Text style={[s.subtitle, { marginTop: 4 }]}>Fecha: {id.fecEmi}</Text>
            <Text style={s.subtitle}>Hora: {id.horEmi}</Text>
            <Text style={s.subtitle}>Ambiente: {id.ambiente === '00' ? 'Pruebas' : 'Producción'}</Text>
          </View>
        </View>

        {/* Emisor / Receptor */}
        <View style={[s.section, s.row]}>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Emisor</Text>
            <Text style={s.label}>Nombre</Text><Text style={s.value}>{emisor.nombre}</Text>
            <Text style={s.label}>NIT</Text><Text style={s.value}>{emisor.nit}</Text>
            <Text style={s.label}>NRC</Text><Text style={s.value}>{emisor.nrc}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Receptor</Text>
            <Text style={s.label}>Nombre</Text><Text style={s.value}>{receptor.nombre}</Text>
            {receptor.nit && <><Text style={s.label}>NIT</Text><Text style={s.value}>{receptor.nit}</Text></>}
            {receptor.nrc && <><Text style={s.label}>NRC</Text><Text style={s.value}>{receptor.nrc}</Text></>}
            {receptor.giroComercial && <><Text style={s.label}>Giro</Text><Text style={s.value}>{receptor.giroComercial}</Text></>}
            {receptor.direccion && <><Text style={s.label}>Dirección</Text><Text style={s.value}>{receptor.direccion}</Text></>}
          </View>
        </View>

        {/* Items table */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle</Text>
          <View style={s.tableHeader}>
            <Text style={{ width: 20 }}>#</Text>
            <Text style={{ flex: 3 }}>Descripción</Text>
            <Text style={{ width: 40, textAlign: 'right' }}>Cant.</Text>
            <Text style={{ width: 55, textAlign: 'right' }}>Precio</Text>
            <Text style={{ width: 45, textAlign: 'right' }}>Desc.</Text>
            <Text style={{ width: 60, textAlign: 'right' }}>Gravado</Text>
          </View>
          {items.map((item, idx) => (
            <View key={item.numItem} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={{ width: 20 }}>{item.numItem}</Text>
              <Text style={{ flex: 3 }}>{item.descripcion}</Text>
              <Text style={{ width: 40, textAlign: 'right' }}>{item.cantidad}</Text>
              <Text style={{ width: 55, textAlign: 'right' }}>{$f(item.precioUni)}</Text>
              <Text style={{ width: 45, textAlign: 'right' }}>{$f(item.montoDescu)}</Text>
              <Text style={{ width: 60, textAlign: 'right' }}>{$f(item.ventaGravada)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsBox}>
          {resumen.totalGravada > 0 && (
            <View style={s.totalsRow}><Text>Ventas gravadas</Text><Text>{$f(resumen.totalGravada)}</Text></View>
          )}
          {resumen.totalExenta > 0 && (
            <View style={s.totalsRow}><Text>Ventas exentas</Text><Text>{$f(resumen.totalExenta)}</Text></View>
          )}
          <View style={s.totalsRow}><Text>IVA (13%)</Text><Text>{$f(resumen.iva)}</Text></View>
          {resumen.retencion1 > 0 && (
            <View style={s.totalsRow}><Text>Retención 1%</Text><Text>-{$f(resumen.retencion1)}</Text></View>
          )}
          <View style={s.totalsRowBold}>
            <Text>TOTAL A PAGAR</Text>
            <Text>{$f(resumen.totalPagar)}</Text>
          </View>
        </View>

        {/* Letras */}
        <View style={s.letrasBox}>
          <Text style={{ fontSize: 7, color: '#555' }}>Son: </Text>
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{resumen.totalLetras}</Text>
        </View>

        {/* Código Generación */}
        <View style={s.codigoBox}>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Código de Generación</Text>
              <Text>{id.codigoGeneracion}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Sello de Recepción</Text>
              <Text>{dte.selloRecepcion ?? 'Pendiente de sello'}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>Generado por FacturaSV — {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          <Text>Documento tributario electrónico</Text>
        </View>
      </Page>
    </Document>
  )
}
