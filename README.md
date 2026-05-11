# FacturaSV — Documentos Tributarios Electrónicos

MVP de generación de facturas electrónicas para El Salvador.
**Sin backend. Sin servidor. Sin cuenta.** Todo se guarda en el navegador.

## Stack

- **Frontend**: React 18 + Vite + TypeScript
- **UI**: Tailwind CSS (mobile-first)
- **Almacenamiento**: `localStorage` del navegador
- **PDF**: @react-pdf/renderer (generación 100% en cliente)
- **Estado**: Zustand
- **Validación**: lógica propia NIT/DUI

## Instalación

```bash
git clone https://github.com/daan2227/facturacionelectronicasv
cd facturacionelectronicasv
npm install
npm run dev
```

No se necesita `.env`. No hay credenciales que configurar.

## Flujo (< 1 minuto en móvil)

```
1. Primera vez: configurar datos de la empresa (NIT, NRC, giro, etc.)
2. Tocar "+ Nueva Factura"
3. Seleccionar tipo de documento
4. Ingresar datos del cliente (NIT/DUI validado)
5. Agregar ítems — IVA y retención calculados automáticamente
6. Tocar "Emitir" — PDF descargado al instante
```

## Cálculo de impuestos

| Concepto | Fórmula |
|---|---|
| IVA 13% | `ventaGravada × 0.13` |
| Retención 1% | `ventaGravada × 0.01` (solo Grandes Contribuyentes) |
| Total a pagar | `subtotal + IVA − retención` |
| Total en letras | Conversión automática requerida por Hacienda |

## Almacenamiento local

| Clave | Contenido |
|---|---|
| `fsv_empresa` | Datos fiscales de la empresa |
| `fsv_clientes` | Directorio de clientes |
| `fsv_documentos` | Historial de DTEs emitidos |

## Respaldo de datos

En **Ajustes** puede exportar un `.json` con todos sus datos e importarlo en otro dispositivo.

## Preparado para API de Hacienda

El objeto `DTEPayload` en `src/types/invoice.ts` sigue el esquema JSON oficial del MH.
Cuando quiera conectar la API REST:

1. Crear `src/services/haciendaApi.ts`
2. Llamar el endpoint de recepción desde `NuevoDocumento.tsx` después de generar el PDF
3. Guardar el `selloRecepcion` en el documento local

## Estructura

```
src/
  lib/storage.ts          ← motor de datos (localStorage)
  store/
    empresaStore.ts       ← reemplaza auth — no hay login
    invoiceStore.ts       ← borrador de factura en curso
  utils/taxUtils.ts       ← IVA, retención, montoToLetras, validarNIT
  components/
    InvoicePDF.tsx        ← PDF generado en el navegador
    ReceptorForm.tsx
    ItemsForm.tsx
    TotalesSummary.tsx
  pages/
    SetupEmpresa.tsx      ← primera vez (reemplaza login)
    Dashboard.tsx
    NuevoDocumento.tsx    ← flujo 4 pasos
    Historial.tsx
    Clientes.tsx
    Ajustes.tsx           ← backup / restaurar / resetear
```
