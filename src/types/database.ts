export interface Database {
  public: {
    Tables: {
      empresas: { Row: Empresa; Insert: Omit<Empresa, 'id' | 'created_at'>; Update: Partial<Empresa> }
      clientes: { Row: Cliente; Insert: Omit<Cliente, 'id' | 'created_at'>; Update: Partial<Cliente> }
      documentos: { Row: Documento; Insert: Omit<Documento, 'id' | 'created_at'>; Update: Partial<Documento> }
      items_documento: { Row: ItemDocumento; Insert: Omit<ItemDocumento, 'id'>; Update: Partial<ItemDocumento> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface Empresa {
  id: string
  created_at: string
  user_id: string
  nit: string
  nrc: string
  nombre: string
  nombre_comercial: string
  giro_comercial: string
  cod_actividad: string
  desc_actividad: string
  tipo_establecimiento: string
  departamento: string
  municipio: string
  direccion: string
  telefono: string
  correo: string
  es_gran_contribuyente: boolean
  correlativo_actual: number
}

export interface Cliente {
  id: string
  created_at: string
  empresa_id: string
  nombre: string
  nombre_comercial: string | null
  nit: string | null
  dui: string | null
  nrc: string | null
  giro_comercial: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  es_gran_contribuyente: boolean
}

export interface Documento {
  id: string
  created_at: string
  empresa_id: string
  cliente_id: string | null
  tipo_dte: string
  numero_control: string
  codigo_generacion: string
  sello_recepcion: string | null
  estado: 'borrador' | 'emitido' | 'anulado'
  ambiente: '00' | '01'
  fecha_emision: string
  hora_emision: string
  condicion_operacion: number
  total_gravada: number
  total_exenta: number
  total_no_suj: number
  iva: number
  retencion_1pct: number
  total_pagar: number
  total_letras: string
  json_dte: Record<string, unknown> | null
}

export interface ItemDocumento {
  id: string
  documento_id: string
  num_item: number
  tipo_item: number
  codigo: string | null
  descripcion: string
  cantidad: number
  unidad_medida: number
  precio_unitario: number
  descuento: number
  venta_gravada: number
  venta_exenta: number
  venta_no_suj: number
}
