import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DTEPayload } from '../types/invoice'

// Sin Font.register externo — usa Helvetica built-in de react-pdf (funciona offline y en WebView)
const s = StyleSheet.create({
  page:          { fontSize: 9, padding: 32, fontFamily: 'Helvetica', color: '#111', backgroundColor: '#fff' },
  bold:          { fontFamily: 'Helvetica-Bold' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  title:         { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0F3F8C' },
  sub:           { fontSize: 7.5, color: '#555', marginTop: 1 },
  sectionTitle:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#0F3F8C', textTransform: 'uppercase',
                   borderBottomWidth: 0.5, borderBottomColor: '#0F3F8C', paddingBottom: 2, marginBottom: 4 },
  row:           { flexDirection: 'row', gap: 8 },
  col:           { flex: 1 },
  label:         { fontSize: 7, color: '#888' },
  val:           { fontSize: 8.5 },
  tableHead:     { flexDirection: 'row', backgroundColor: '#0F3F8C', padding: '4 6', borderRadius: 2 },
  tableHeadText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#fff' },
  tableRow:      { flexDirection: 'row', padding: '3 6', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableRowAlt:   { flexDirection: 'row', padding: '3 6', backgroundColor: '#f9fafb',
                   borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  totalsBox:     { marginTop: 8, alignSelf: 'flex-end', width: 210 },
  totalsRow:     { flexDirection: 'row', justifyContent: 'space-between', padding: '2 4' },
  totalsTotal:   { flexDirection: 'row', justifyContent: 'space-between', padding: '3 6',
                   backgroundColor: '#0F3F8C', borderRadius: 2, marginTop: 2 },
  totalsTotalTx: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#fff' },
  letrasBox:     { marginTop: 8, padding: 6, backgroundColor: '#eff6ff', borderRadius: 3 },
  codigoBox:     { marginTop: 8, padding: 6, borderWidth: 0.5, borderColor: '#d1d5db', borderRadius: 3 },
  footer:        { position: 'absolute', bottom: 18, left: 32, right: 32,
                   flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#aaa' },
})

const $f = (n: number) => `$${n.toFixed(2)}`

const TIPO: Record<string, string> = {
  '01': 'FACTURA CONSUMIDOR FINAL',
  '03': 'CRÉDITO FISCAL',
  '05': 'NOTA DE CRÉDITO',
  '06': 'NOTA DE DÉBITO',
}

export default function InvoicePDF({ dte }: { dte: DTEPayload }) {
  const { identificacion: id, emisor, receptor, cuerpoDocumento: items, resumen } = dte

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Encabezado */}
        <View style={s.header}>
          <View style={{ flex: 2 }}>
            <Text style={s.title}>{emisor.nombreComercial || emisor.nombre}</Text>
            <Text style={s.sub}>{emisor.nombre}</Text>
            <Text style={s.sub}>NIT: {emisor.nit}  •  NRC: {emisor.nrc}</Text>
            <Text style={s.sub}>{emisor.descActividad}</Text>
            <Text style={s.sub}>{emisor.direccion.complemento}</Text>
            <Text style={s.sub}>Tel: {emisor.telefono}  •  {emisor.correo}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Text style={[s.title, { fontSize: 11 }]}>{TIPO[id.tipoDte] ?? id.tipoDte}</Text>
            <Text style={[s.sub, { marginTop: 4 }]}>N° Control:</Text>
            <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{id.numeroControl}</Text>
            <Text style={[s.sub, { marginTop: 4 }]}>Fecha: {id.fecEmi}</Text>
            <Text style={s.sub}>Hora: {id.horEmi}</Text>
            <Text style={s.sub}>Ambiente: {id.ambiente === '00' ? 'Pruebas' : 'Producción'}</Text>
          </View>
        </View>

        {/* Emisor / Receptor */}
        <View style={[{ marginBottom: 12 }, s.row]}>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Emisor</Text>
            <Text style={s.label}>Razón Social</Text><Text style={s.val}>{emisor.nombre}</Text>
            <Text style={s.label}>NIT</Text><Text style={s.val}>{emisor.nit}</Text>
            <Text style={s.label}>NRC</Text><Text style={s.val}>{emisor.nrc}</Text>
            <Text style={s.label}>Actividad</Text><Text style={s.val}>{emisor.descActividad}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Receptor</Text>
            <Text style={s.label}>Nombre</Text><Text style={s.val}>{receptor.nombre}</Text>
            {receptor.nit  && <><Text style={s.label}>NIT</Text><Text style={s.val}>{receptor.nit}</Text></>}
            {receptor.nrc  && <><Text style={s.label}>NRC</Text><Text style={s.val}>{receptor.nrc}</Text></>}
            {receptor.giroComercial && <><Text style={s.label}>Giro</Text><Text style={s.val}>{receptor.giroComercial}</Text></>}
            {receptor.direccion     && <><Text style={s.label}>Dirección</Text><Text style={s.val}>{receptor.direccion}</Text></>}
          </View>
        </View>

        {/* Tabla de ítems */}
        <View style={{ marginBottom: 4 }}>
          <Text style={s.sectionTitle}>Detalle</Text>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadText, { width: 18 }]}>#</Text>
            <Text style={[s.tableHeadText, { flex: 3 }]}>Descripción</Text>
            <Text style={[s.tableHeadText, { width: 38, textAlign: 'right' }]}>Cant.</Text>
            <Text style={[s.tableHeadText, { width: 54, textAlign: 'right' }]}>P. Unit.</Text>
            <Text style={[s.tableHeadText, { width: 44, textAlign: 'right' }]}>Desc.</Text>
            <Text style={[s.tableHeadText, { width: 58, textAlign: 'right' }]}>Gravado</Text>
          </View>
          {items.map((item, idx) => (
            <View key={item.numItem} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={{ width: 18 }}>{item.numItem}</Text>
              <Text style={{ flex: 3 }}>{item.descripcion}</Text>
              <Text style={{ width: 38, textAlign: 'right' }}>{item.cantidad}</Text>
              <Text style={{ width: 54, textAlign: 'right' }}>{$f(item.precioUni)}</Text>
              <Text style={{ width: 44, textAlign: 'right' }}>{$f(item.montoDescu)}</Text>
              <Text style={{ width: 58, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>{$f(item.ventaGravada)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={s.totalsBox}>
          {resumen.totalGravada > 0 &&
            <View style={s.totalsRow}><Text>Ventas gravadas</Text><Text>{$f(resumen.totalGravada)}</Text></View>}
          {resumen.totalExenta > 0 &&
            <View style={s.totalsRow}><Text>Ventas exentas</Text><Text>{$f(resumen.totalExenta)}</Text></View>}
          <View style={s.totalsRow}><Text>IVA (13%)</Text><Text>{$f(resumen.iva)}</Text></View>
          {resumen.retencion1 > 0 &&
            <View style={s.totalsRow}><Text>Retención 1%</Text><Text>-{$f(resumen.retencion1)}</Text></View>}
          <View style={s.totalsTotal}>
            <Text style={s.totalsTotalTx}>TOTAL A PAGAR</Text>
            <Text style={s.totalsTotalTx}>{$f(resumen.totalPagar)}</Text>
          </View>
        </View>

        {/* Monto en letras */}
        <View style={s.letrasBox}>
          <Text style={{ fontSize: 7, color: '#555' }}>Son: </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{resumen.totalLetras}</Text>
        </View>

        {/* Código de generación */}
        <View style={s.codigoBox}>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Código de Generación</Text>
              <Text style={{ fontSize: 7.5 }}>{id.codigoGeneracion}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Sello de Recepción</Text>
              <Text style={{ fontSize: 7.5, color: dte.selloRecepcion ? '#166534' : '#9ca3af' }}>
                {dte.selloRecepcion ?? 'Pendiente de sello MH'}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Text>Generado por FacturaSV</Text>
          <Text>Documento tributario electrónico — {id.fecEmi}</Text>
        </View>

      </Page>
    </Document>
  )
}
