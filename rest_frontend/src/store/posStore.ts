import { create } from 'zustand'

// 1. Definición de Tipos
export type TableStatus = "Libre" | "Ocupada" | "Reservada"

export interface OrderItem {
  cartId: string;
  orderId?: string;
  productId: number | string;
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
}

export interface Transaction {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  time: string
  method: "Efectivo" | "QR" | "Tarjeta" | "N/A"
  cashierName: string 
  // Nuevos campos para registro multimoneda y vuelto
  currency?: "Bs" | "USD"
  exchangeRate?: number
  amountReceived?: number
  change?: number
}

// Datos iniciales de las mesas (Los movemos aquí desde TableMap)
const INITIAL_TABLES: Table[] = [
  { id: "t1", number: 1, capacity: 4, status: "Libre" },
  { id: "t2", number: 2, capacity: 4, status: "Libre" },
  { id: "t3", number: 3, capacity: 2, status: "Libre" },
  { id: "t4", number: 4, capacity: 6, status: "Libre" },
  { id: "t5", number: 5, capacity: 4, status: "Libre" },
  { id: "t6", number: 6, capacity: 8, status: "Libre" },
  { id: "t7", number: 7, capacity: 2, status: "Libre" },
  { id: "t8", number: 8, capacity: 10, status: "Libre" },
]

// 2. Interfaz del Store
interface PosState {
  tables: Table[]
  transactions: Transaction[]
  isShiftOpen: boolean
  shiftInitialBalance: number
  
  // Acciones
  updateTable: (updatedTable: Table) => void
  addTable: (number: number, capacity: number) => void
  deleteTable: (id: string) => void
  editTable: (id: string, number: number, capacity: number) => void
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  toggleShift: (isOpen: boolean, initialBalance?: number) => void
  processPayment: (
    tableId: string, 
    method: Transaction["method"], 
    cashierName: string,
    currency?: "Bs" | "USD",
    amountReceived?: number,
    change?: number,
    exchangeRate?: number
  ) => void
}

// 3. Creación del Store
export const usePosStore = create<PosState>((set, get) => ({
  tables: INITIAL_TABLES,
  transactions: [],
  isShiftOpen: false,
  shiftInitialBalance: 0,

  updateTable: (updatedTable) => set((state) => ({
    tables: state.tables.map(t => t.id === updatedTable.id ? updatedTable : t)
  })),

  addTable: (number, capacity) => set((state) => ({
    tables: [...state.tables, {
      id: `t_${Date.now()}`,
      number,
      capacity,
      status: "Libre",
      orders: []
    }]
  })),

  deleteTable: (id) => set((state) => ({
    tables: state.tables.filter(t => t.id !== id)
  })),

  editTable: (id, number, capacity) => set((state) => ({
    tables: state.tables.map(t => t.id === id ? { ...t, number, capacity } : t)
  })),

  addTransaction: (tx) => set((state) => ({
    transactions: [{ ...tx, id: crypto.randomUUID() }, ...state.transactions]
  })),

  toggleShift: (isOpen, initialBalance = 0) => set(() => ({
    isShiftOpen: isOpen,
    shiftInitialBalance: isOpen ? initialBalance : 0,
    transactions: isOpen ? [] : []
  })),

  // Modificado para aceptar y guardar los nuevos parámetros multimoneda
  processPayment: (tableId, method, cashierName, currency = "Bs", amountReceived = 0, change = 0, exchangeRate = 6.96) => {
    const table = get().tables.find(t => t.id === tableId)
    if (!table || table.status !== "Ocupada" || !table.currentTotal) return

    get().addTransaction({
      type: "income",
      description: `Cobro Mesa ${table.number} (${table.customerName || 'Cliente'})`,
      amount: table.currentTotal, // El monto base siempre en Bs. para la contabilidad
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: method,
      cashierName: cashierName,
      currency,
      amountReceived,
      change,
      exchangeRate
    })

    get().updateTable({
      ...table,
      status: "Libre",
      customerName: undefined,
      activeTime: undefined,
      currentTotal: 0,
      orders: []
    })
  }
}))