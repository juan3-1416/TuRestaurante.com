import { useState } from "react"
import { Table, OrderItem } from "@/store/posStore"

export function useTableStatusDetail(table: Table) {
  const [isReserving, setIsReserving] = useState(false)
  const [reserveName, setReserveName] = useState("")
  const [reserveTime, setReserveTime] = useState("")

  const [prevTableId, setPrevTableId] = useState<string | null>(null)

  if (table.id !== prevTableId) {
    setPrevTableId(table.id)
    setIsReserving(false)
    setReserveName("")
    setReserveTime("")
  }

  // 1. Calculamos el total leyendo directamente de la mesa
  const calculatedTotal = table.currentTotal || 0;

  // 2. Agrupamos por tickets
  const groupedTickets = (table.orders || []).reduce((acc, order) => {
    const tId = order.orderId || "Orden 1"; 
    if (!acc[tId]) {
      acc[tId] = { id: tId, items: [], total: 0 };
    }
    acc[tId].items.push(order);
    acc[tId].total += order.price;
    return acc;
  }, {} as Record<string, { id: string, items: OrderItem[], total: number }>);
  
  const tickets = Object.values(groupedTickets);

  return {
    isReserving,
    setIsReserving,
    reserveName,
    setReserveName,
    reserveTime,
    setReserveTime,
    calculatedTotal,
    tickets
  }
}
