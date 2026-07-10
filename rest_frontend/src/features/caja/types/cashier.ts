// Tipos alineados con el backend actual + campos futuros de moneda
// Referencia: backend/apps/cashier/interfaces/serializers.py

export type TransactionType = "income" | "expense";
export type PaymentMethod = "Efectivo" | "QR" | "Tarjeta" | "N/A";
export type Currency = "BOB" | "USD";

/**
 * Representa una transacción tal como la devuelve el backend (TransactionSerializer).
 * Campos opcionales (currency, exchange_rate, amount_foreign) serán implementados
 * por el equipo de backend en una próxima iteración.
 */
export interface BackendTransaction {
  id: number;
  shift: number;
  transaction_type: TransactionType;    // campo real: "income" | "expense"
  description: string;
  amount: string;                        // DecimalField llega como string desde DRF
  payment_method: PaymentMethod;         // campo real: "Efectivo" | "QR" | "Tarjeta" | "N/A"
  created_at: string;                    // ISO datetime string (auto_now_add)
  // Campos futuros — opcionales hasta que el backend los implemente:
  currency?: Currency;                   // "BOB" | "USD"
  exchange_rate?: string | null;         // Tasa de cambio usada al momento del cobro
  amount_foreign?: string | null;        // Monto en USD si se pagó en USD
}

/**
 * Representa un turno de caja tal como lo devuelve el backend (CashShiftSerializer).
 */
export interface BackendCashShift {
  id: number;
  user: number;
  cashier_name: string;
  initial_balance: string;              // DecimalField como string desde DRF
  start_time: string;
  end_time: string | null;
  is_open: boolean;
  total_income: string;                 // Calculado por el backend al cerrar
  total_expense: string;                // OJO: "total_expense" (sin 's')
  final_balance: string | null;         // null mientras el turno está abierto
  transactions: BackendTransaction[];
}

/**
 * Respuesta del endpoint GET /cashier/exchange-rate/
 * Implementado por el equipo de backend.
 */
export interface ExchangeRateResponse {
  USD_TO_BOB: number;
  updated_at?: string;
}
