# Plan de Implementación: Consistencia de Datos – Sección Caja (v2)

## Descripción

La sección de Caja debe quedar lista para conectarse al backend actual **y** a los nuevos campos que el compañero de equipo implementará (tipo de cambio, moneda, etc.). El objetivo es:

1. Corregir campos incorrectos que ya causan inconsistencia hoy
2. Dejar el frontend preparado para los nuevos endpoints/campos del backend (exchange-rate, `currency`, `exchange_rate`, `amount_foreign` en transacciones)

**No se modifica la lógica de negocio, solo los nombres de campos y contratos de datos.**

---

## Nuevos Campos que el Backend Implementará (referencia para el compañero)

El backend deberá agregar al modelo `Transaction`:
```python
currency        = CharField(choices=["BOB","USD"], default="BOB")
exchange_rate   = DecimalField(null=True, blank=True)   # Tasa usada al momento del cobro
amount_foreign  = DecimalField(null=True, blank=True)   # Monto en USD si aplica
```

Y un nuevo endpoint:
```
GET /cashier/exchange-rate/
Response: { "USD_TO_BOB": 6.96, "updated_at": "..." }
```

Y la vista `pay` de orders deberá aceptar:
```json
{ "payment_method": "Efectivo", "currency": "USD", "exchange_rate": 6.96, "amount_foreign": 10.00 }
```

---

## Cambios Propuestos en el Frontend

### ─── BLOQUE 1: Nuevos Tipos TypeScript ───

#### [NEW] `types/cashier.ts`
Crear un archivo de tipos dedicado para la sección caja que modele exactamente lo que devuelve (y devolverá) el backend.

```ts
// Tipos alineados con el backend actual + campos futuros de moneda

export type TransactionType = "income" | "expense";
export type PaymentMethod = "Efectivo" | "QR" | "Tarjeta" | "N/A";
export type Currency = "BOB" | "USD";

export interface BackendTransaction {
  id: number;
  shift: number;
  transaction_type: TransactionType;     // ← campo real del backend
  description: string;
  amount: string;                         // Decimal viene como string desde DRF
  payment_method: PaymentMethod;          // ← campo real del backend
  created_at: string;                     // ← campo real del backend (ISO datetime)
  // Campos futuros (opcionales hasta que el backend los implemente):
  currency?: Currency;
  exchange_rate?: string;
  amount_foreign?: string | null;
}

export interface BackendCashShift {
  id: number;
  user: number;
  cashier_name: string;
  initial_balance: string;               // Decimal como string desde DRF
  start_time: string;
  end_time: string | null;
  is_open: boolean;
  total_income: string;
  total_expense: string;                 // ← NO es "total_expenses"
  final_balance: string | null;
  transactions: BackendTransaction[];
}

export interface ExchangeRateResponse {
  USD_TO_BOB: number;
  updated_at?: string;
}
```

---

### ─── BLOQUE 2: Hook `useExchangeRate` ───

#### [NEW] `features/caja/hooks/useExchangeRate.ts`
Hook que consulta el tipo de cambio al backend. Mientras el endpoint no exista, usa el valor hardcodeado como fallback, sin romper nada.

```ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ExchangeRateResponse } from "../types/cashier";

const FALLBACK_RATE = 7.52; // Usado hasta que el backend implemente el endpoint

export function useExchangeRate() {
  const { data } = useQuery<ExchangeRateResponse>({
    queryKey: ["exchangeRate"],
    queryFn: async () => {
      const response = await apiClient.get("/cashier/exchange-rate/");
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // Refrescar cada 10 minutos
    retry: false,               // Si el endpoint no existe, usar fallback silenciosamente
  });

  return data?.USD_TO_BOB ?? FALLBACK_RATE;
}
```

---

### ─── BLOQUE 3: Modificar `useCaja.ts` ───

#### [MODIFY] [`useCaja.ts`](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/caja/hooks/useCaja.ts)

**Cambios:**
- L7: Importar `useExchangeRate`
- L9: Eliminar `export const EXCHANGE_RATE = 7.52` (ahora viene del hook)
- L33: `shift.total_expenses` → `shift.total_expense`
- L34: `shift.current_balance` → calculado: `initial_balance + total_income - total_expense`
- L27: El tipo de `paymentMethod` ya es correcto (`"Efectivo" | "QR" | "Tarjeta"`)
- L97-L99: El payload de pago debe incluir los campos de moneda preparados para el backend

**Payload actualizado al pagar una orden:**
```ts
await apiClient.post(`/orders/${orderId}/pay/`, {
  payment_method: paymentMethod,
  // Campos preparados para cuando el backend los acepte:
  currency: paymentCurrency === "USD" ? "USD" : "BOB",
  exchange_rate: exchangeRate,
  amount_foreign: paymentCurrency === "USD" ? (Number(amountReceived) || null) : null,
});
```
> El backend actual ignorará `currency`, `exchange_rate`, `amount_foreign` hasta que los implemente. No rompe nada.

---

### ─── BLOQUE 4: Modificar `CloseShiftModal.tsx` ───

#### [MODIFY] [`CloseShiftModal.tsx`](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/caja/components/CloseShiftModal.tsx)

**Cambios:**
- L9: Reemplazar import de `Transaction` de `posStore` → usar `BackendTransaction` de los nuevos tipos
- L21: `const transactions: BackendTransaction[]`
- L27-L28: Usar `shift.total_income` y `shift.total_expense` directamente (ya calculados por backend)
- L32-L35: Filtrar por `t.payment_method` en lugar de `t.method`
- L24: La constante `EXCHANGE_RATE = 6.96` → reemplazar con el hook `useExchangeRate()`

```ts
// ANTES (incorrecto)
const income = transactions.filter((t) => t.type === "income")...  // t.type no existe
const incomeQR = transactions.filter((t) => t.method === "QR")...  // t.method no existe

// DESPUÉS (correcto)
const income = shift ? Number(shift.total_income) : 0               // dato directo del backend
const expenses = shift ? Number(shift.total_expense) : 0            // dato directo del backend
const incomeQR = transactions
  .filter((t) => t.transaction_type === "income" && t.payment_method === "QR")
  .reduce((acc, t) => acc + Number(t.amount), 0)
```

---

### ─── BLOQUE 5: Modificar `CajaTransactionHistory.tsx` ───

#### [MODIFY] [`CajaTransactionHistory.tsx`](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/caja/components/CajaTransactionHistory.tsx)

**Cambios:**
- L2: Reemplazar import de `Transaction` de `posStore` → `BackendTransaction`
- L6: Cambiar tipo del prop `transactions: BackendTransaction[]`
- L48: `tx.time` → `new Date(tx.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })`
- L52-L55: `tx.method` → `tx.payment_method`
- L60: `tx.currency` → `tx.currency ?? "BOB"` (fallback hasta que backend lo implemente)
  - Si `currency === "USD"` → mostrar `$ USD`
  - Si `currency === "BOB"` o no existe → mostrar `Bs.`
- L65: `tx.type` → `tx.transaction_type`
- L67: `tx.type` → `tx.transaction_type`, `tx.amount.toFixed(2)` → `Number(tx.amount).toFixed(2)` (amount llega como string desde DRF)

---

### ─── BLOQUE 6: Actualizar `EXCHANGE_RATE` en `CajaPaymentModal.tsx` y `CajaSummaryCards.tsx` ───

#### [MODIFY] Ambos componentes importan `EXCHANGE_RATE` de `useCaja.ts` como constante hardcodeada.

Dado que `EXCHANGE_RATE` ya no será una constante exportada sino el valor devuelto por el hook, hay que adaptar cómo reciben la tasa:
- `CajaPaymentModal`: recibir `exchangeRate` como prop
- `CajaSummaryCards`: recibir `exchangeRate` como prop
- `CajaDashboard`: pasar `exchangeRate` desde `useCaja`

---

## Resumen de Archivos a Crear/Modificar

| Acción | Archivo | Razón |
|--------|---------|-------|
| **[NEW]** | `features/caja/types/cashier.ts` | Tipos alineados con backend actual + campos futuros |
| **[NEW]** | `features/caja/hooks/useExchangeRate.ts` | Tasa de cambio dinámica con fallback |
| **[MODIFY]** | `features/caja/hooks/useCaja.ts` | Corregir campos + integrar exchange rate + payload de pago |
| **[MODIFY]** | `features/caja/components/CloseShiftModal.tsx` | Corregir campos de transacciones |
| **[MODIFY]** | `features/caja/components/CajaTransactionHistory.tsx` | Corregir campos + campo currency opcional |
| **[MODIFY]** | `features/caja/components/CajaPaymentModal.tsx` | Recibir `exchangeRate` como prop |
| **[MODIFY]** | `features/caja/components/CajaSummaryCards.tsx` | Recibir `exchangeRate` como prop |
| **[MODIFY]** | `features/caja/components/CajaDashboard.tsx` | Pasar `exchangeRate` a los componentes |

---

## Verificación

- ✅ No se rompe nada si el backend no tiene aún el endpoint `/cashier/exchange-rate/` (fallback a `7.52`)
- ✅ No se rompe nada si las transacciones no tienen aún `currency`/`exchange_rate`/`amount_foreign` (campos opcionales con `??`)
- ✅ Cuando el compañero implemente el backend, el frontend se conecta automáticamente sin más cambios
- ✅ Los campos `total_income`, `total_expense`, `payment_method`, `transaction_type`, `created_at` funcionan desde ya con el backend actual

> [!IMPORTANT]
> La referencia de campos para el compañero de backend es la sección **"Nuevos Campos que el Backend Implementará"** al inicio del plan.
