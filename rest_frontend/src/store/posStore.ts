import { create } from 'zustand'

// 1. Definición de Tipos
export type TableStatus = "Libre" | "Ocupada" | "Reservada"

export interface OrderItem {
  cartId: string;
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
  cashierName: string // Aquí guardaremos quién hizo la transacción
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
  processPayment: (tableId: string, method: Transaction["method"], cashierName: string) => void
}

// 3. Creación del Store
export const usePosStore = create<PosState>((set, get) => ({
  tables: INITIAL_TABLES,
  transactions: [],
  isShiftOpen: false,
  shiftInitialBalance: 0,

  // Actualiza una mesa específica (ej. de Libre a Ocupada)
  updateTable: (updatedTable) => set((state) => ({
    tables: state.tables.map(t => t.id === updatedTable.id ? updatedTable : t)
  })),

  // Agrega una nueva mesa localmente
  addTable: (number, capacity) => set((state) => ({
    tables: [...state.tables, {
      id: `t_${Date.now()}`,
      number,
      capacity,
      status: "Libre",
      orders: []
    }]
  })),

  // Elimina una mesa localmente
  deleteTable: (id) => set((state) => ({
    tables: state.tables.filter(t => t.id !== id)
  })),

  // Edita una mesa localmente
  editTable: (id, number, capacity) => set((state) => ({
    tables: state.tables.map(t => t.id === id ? { ...t, number, capacity } : t)
  })),

  // Añade un ingreso o gasto al historial de la caja
  addTransaction: (tx) => set((state) => ({
    transactions: [{ ...tx, id: crypto.randomUUID() }, ...state.transactions]
  })),

  // Abre o cierra la caja
  toggleShift: (isOpen, initialBalance = 0) => set(() => ({
    isShiftOpen: isOpen,
    shiftInitialBalance: isOpen ? initialBalance : 0,
    transactions: isOpen ? [] : [] // Opcional: Limpiar transacciones al cerrar turno
  })),

  // MAGIA: Esta función cobra la mesa, la libera y registra el ingreso en la caja
  processPayment: (tableId, method, cashierName) => {
    const table = get().tables.find(t => t.id === tableId)
    if (!table || table.status !== "Ocupada" || !table.currentTotal) return

    // 1. Registramos el ingreso
    get().addTransaction({
      type: "income",
      description: `Cobro Mesa ${table.number} (${table.customerName || 'Cliente'})`,
      amount: table.currentTotal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: method,
      cashierName: cashierName
    })

    // 2. Liberamos la mesa
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