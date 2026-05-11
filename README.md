# FacturaSV — Documentos Tributarios Electrónicos

MVP de generación de facturas electrónicas para El Salvador, preparado para integración con la API REST del Ministerio de Hacienda.

## Stack

- **Frontend**: React 18 + Vite + TypeScript
- **UI**: Tailwind CSS (mobile-first)
- **Backend/Auth/DB**: Supabase (PostgreSQL + RLS)
- **PDF**: @react-pdf/renderer (generación en cliente)
- **Estado**: Zustand
- **Validación**: Zod + lógica propia NIT/DUI

## Configuración inicial

### 1. Clonar y dependencias
```bash
git clone https://github.com/daan2227/facturacionelectronicasv
cd facturacionelectronicasv
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 3. Base de datos (Supabase)
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar `supabase/migrations/001_initial_schema.sql`
3. Copiar `Project URL` y `anon public key` a tu `.env`

### 4. Iniciar en desarrollo
```bash
npm run dev
```

## Flujo de emisión (< 1 minuto en móvil)

```
1. Seleccionar tipo de documento (Factura / Crédito Fiscal)
2. Buscar o ingresar datos del cliente (NIT/NRC validado)
3. Agregar ítems con precio — IVA y retención calculados automáticamente
4. Revisar resumen y tocar "Emitir" — PDF descargado instantáneamente
```

## Cálculo de impuestos

| Concepto | Fórmula |
|---|---|
| IVA (13%) | `ventaGravada × 0.13` |
| Retención 1% | `ventaGravada × 0.01` (solo Grandes Contribuyentes) |
| Total a pagar | `subtotal + IVA − retención1%` |

## Tipos de DTE soportados

| Código | Nombre |
|---|---|
| 01 | Factura Consumidor Final |
| 03 | Crédito Fiscal |
| 05 | Nota de Crédito |
| 06 | Nota de Débito |

## Preparado para API Hacienda

El objeto `DTEPayload` en `src/types/invoice.ts` sigue la estructura JSON del esquema oficial del MH. Para conectar la API REST:

1. Configurar credenciales MH en variables de entorno
2. Crear `src/services/haciendaApi.ts` con el endpoint de recepciFn de DTE
3. Llamar desde `NuevoDocumento.tsx` después de generar el PDF
4. Guardar el `selloRecepcion` devuelto en la tabla `documentos`

## Estructura del proyecto

```
src/
  components/     # UI reutilizable
    Layout.tsx
    TipoDteSelector.tsx
    ReceptorForm.tsx      # Validación NIT/DUI/NRC
    ItemsForm.tsx
    TotalesSummary.tsx
    InvoicePDF.tsx        # Renderizador PDF
  pages/
    LoginPage.tsx
    Dashboard.tsx
    NuevoDocumento.tsx    # Flujo de 4 pasos
    Historial.tsx
    Clientes.tsx
  store/
    authStore.ts          # Supabase Auth
    invoiceStore.ts       # Estado del borrador
  utils/
    taxUtils.ts           # IVA, retención, montoToLetras, validarNIT
  types/
    invoice.ts            # DTEPayload, LineItem, Receptor...
    database.ts           # Tipos Supabase
  lib/
    supabase.ts
supabase/
  migrations/
    001_initial_schema.sql  # Tablas + RLS + función correlativo
```
