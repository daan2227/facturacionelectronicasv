-- ============================================================
-- FacturaSV — Esquema inicial de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
Create table empresas (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- Datos fiscales El Salvador
  nit                   varchar(14) not null,          -- 14 dígitos sin guiones
  nrc                   varchar(10) not null,          -- ej. 123456-7
  nombre                text not null,
  nombre_comercial      text,
  giro_comercial        text not null,
  cod_actividad         varchar(10) not null,
  desc_actividad        text not null,
  tipo_establecimiento  varchar(2) not null default '01',

  -- Dirección
  departamento  varchar(2) not null,
  municipio     varchar(2) not null,
  direccion     text not null,

  -- Contacto
  telefono  varchar(20),
  correo    text,

  -- Configuración DTE
  es_gran_contribuyente boolean not null default false,
  correlativo_actual    bigint not null default 1,
  ambiente              varchar(2) not null default '00', -- 00=pruebas, 01=produccion

  constraint empresas_nit_unique unique (nit)
);

-- ──────────────────────────────────────────────────────────────
create table clientes (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  empresa_id    uuid not null references empresas(id) on delete cascade,

  nombre              text not null,
  nombre_comercial    text,

  -- Identificación El Salvador
  nit   varchar(14),
  dui   varchar(9),
  nrc   varchar(10),

  giro_comercial      text,
  telefono            varchar(20),
  correo              text,
  direccion           text,
  es_gran_contribuyente boolean not null default false
);

create index clientes_empresa_id_idx on clientes(empresa_id);
create index clientes_nombre_idx on clientes(nombre);
create index clientes_nit_idx on clientes(nit);

-- ──────────────────────────────────────────────────────────────
create table documentos (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  cliente_id    uuid references clientes(id) on delete set null,

  -- Identificación DTE Hacienda El Salvador
  tipo_dte            varchar(2)  not null,  -- 01 Factura, 03 CF, 04 NR, 05 NC, 06 ND, 11 FE
  numero_control      varchar(40) not null,
  codigo_generacion   uuid        not null default uuid_generate_v4(),
  sello_recepcion     text,
  estado              text not null default 'borrador' check (estado in ('borrador','emitido','anulado')),
  ambiente            varchar(2) not null default '00',

  -- Fechas
  fecha_emision date not null,
  hora_emision  time not null,

  -- Totales
  condicion_operacion   int not null default 1,  -- 1=contado, 2=crédito, 3=otro
  total_gravada         numeric(12,2) not null default 0,
  total_exenta          numeric(12,2) not null default 0,
  total_no_suj          numeric(12,2) not null default 0,
  iva                   numeric(12,2) not null default 0,
  retencion_1pct        numeric(12,2) not null default 0,
  total_pagar           numeric(12,2) not null default 0,
  total_letras          text,

  -- JSON completo del DTE (para API Hacienda)
  json_dte  jsonb,

  constraint documentos_numero_control_empresa_unique unique (empresa_id, numero_control)
);

create index documentos_empresa_id_idx on documentos(empresa_id);
create index documentos_fecha_idx on documentos(fecha_emision desc);
create index documentos_estado_idx on documentos(estado);
create index documentos_codigo_generacion_idx on documentos(codigo_generacion);

-- ──────────────────────────────────────────────────────────────
create table items_documento (
  id              uuid primary key default uuid_generate_v4(),
  documento_id    uuid not null references documentos(id) on delete cascade,
  num_item        smallint not null,
  tipo_item       smallint not null default 1,  -- 1=bien, 2=servicio, 3=ambos, 4=otros
  codigo          text,
  descripcion     text not null,
  cantidad        numeric(12,4) not null,
  unidad_medida   smallint not null default 59,
  precio_unitario numeric(12,4) not null,
  descuento       numeric(12,2) not null default 0,
  venta_gravada   numeric(12,2) not null default 0,
  venta_exenta    numeric(12,2) not null default 0,
  venta_no_suj    numeric(12,2) not null default 0
);

create index items_documento_id_idx on items_documento(documento_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table empresas       enable row level security;
alter table clientes       enable row level security;
alter table documentos     enable row level security;
alter table items_documento enable row level security;

-- Empresa: solo su dueño
create policy "empresa_owner" on empresas
  using (user_id = auth.uid());

create policy "empresa_owner_insert" on empresas
  for insert with check (user_id = auth.uid());

-- Clientes: solo de la empresa del usuario
create policy "clientes_via_empresa" on clientes
  using (
    empresa_id in (select id from empresas where user_id = auth.uid())
  );

create policy "clientes_insert" on clientes
  for insert with check (
    empresa_id in (select id from empresas where user_id = auth.uid())
  );

-- Documentos
create policy "documentos_via_empresa" on documentos
  using (
    empresa_id in (select id from empresas where user_id = auth.uid())
  );

create policy "documentos_insert" on documentos
  for insert with check (
    empresa_id in (select id from empresas where user_id = auth.uid())
  );

create policy "documentos_update" on documentos
  for update using (
    empresa_id in (select id from empresas where user_id = auth.uid())
  );

-- Items
create policy "items_via_documento" on items_documento
  using (
    documento_id in (
      select d.id from documentos d
      join empresas e on e.id = d.empresa_id
      where e.user_id = auth.uid()
    )
  );

create policy "items_insert" on items_documento
  for insert with check (
    documento_id in (
      select d.id from documentos d
      join empresas e on e.id = d.empresa_id
      where e.user_id = auth.uid()
    )
  );

-- ============================================================
-- Función: auto-incrementar correlativo por empresa
-- ============================================================
create or replace function next_numero_control(p_empresa_id uuid, p_tipo_dte varchar)
returns text language plpgsql security definer as $$
declare
  v_correlativo bigint;
begin
  update empresas
  set correlativo_actual = correlativo_actual + 1
  where id = p_empresa_id
  returning correlativo_actual into v_correlativo;

  return format('DTE-%s-C0010000-%s',
    p_tipo_dte,
    lpad(v_correlativo::text, 15, '0')
  );
end;
$$;
