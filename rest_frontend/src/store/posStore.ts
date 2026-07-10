import { create } from 'zustand'

// 1. Definición de Tipos
export type TableStatus = "Libre" | "Ocupada" | "Reservada"

export interface OrderItem {
  cartId: string;
  orderId?: string;
  productId: number | string;
  id?: number | string; // Backend expects 'id' as product id
  name: string;
  price: number;
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
  activeOrderId?: number | string | null // ID real de la orden en el backend
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
    transactions: [{ ...tx, id: crypto.randomUUID() }, ...state.transactions]
  })),

  toggleShift: (isOpen, initialBalance = 0) => set(() => ({
    isShiftOpen: isOpen,
    shiftInitialBalance: isOpen ? initialBalance : 0,
    transactions: isOpen ? [] : []
  }))
}))