import { create } from 'zustand'
import { generateId } from '@/lib/utils'

// 1. Definición de Tipos
export type TableStatus = "Libre" | "Ocupada" | "Reservada" | "Observada"

export interface OrderItem {
  cartId: string;
  orderId?: string;
  productId: number | string;
  id?: number | string; // Backend expects 'id' as product id
  name: string;
  price: number;
  isTakeaway?: boolean;  // Para llevar
  orderNote?: string;    // Descripción del pedido (viene del backend por cada ítem)
}

export interface Table {
  id: string
  number: number
  capacity: number
  status: TableStatus
  currentTotal?: number
  activeTime?: string
  customerName?: string
  orders?: OrderItem[]
  activeOrderId?: number | string | null  // ID real de la primera orden en el backend
  activeOrderIds?: (number | string)[]    // IDs de TODAS las órdenes activas (multi-ticket)
  observationNote?: string | null         // Nota de fuga (walkout)
  waiter?: string | null                  // Nombre del mesero que atendió
}

export interface Transaction {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  time: string
  method: "Efectivo" | "QR" | "Tarjeta" | "N/A"
  cashierName: string 
  currency?: "Bs" | "USD"
  exchangeRate?: number
  amountReceived?: number
  change?: number
}

// 2. Interfaz del Store
interface PosState {
  transactions: Transaction[]
  isShiftOpen: boolean
  shiftInitialBalance: number
  
  // Acciones (las tablas ahora se manejan en React Query)
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  toggleShift: (isOpen: boolean, initialBalance?: number) => void
}

// 3. Creación del Store
export const usePosStore = create<PosState>((set) => ({
  transactions: [],
  isShiftOpen: false,
  shiftInitialBalance: 0,

  addTransaction: (tx) => set((state) => ({
    transactions: [{ ...tx, id: generateId() }, ...state.transactions]
  })),

  toggleShift: (isOpen, initialBalance = 0) => set(() => ({
    isShiftOpen: isOpen,
    shiftInitialBalance: isOpen ? initialBalance : 0,
    transactions: isOpen ? [] : []
  }))
}))