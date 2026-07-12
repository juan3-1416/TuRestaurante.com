import { useState } from "react"
import { Table, OrderItem } from "@/store/posStore"

export function useTableStatusDetail(table: Table) {
  const [isReserving, setIsReserving] = useState(false)
  const [reserveName, setReserveName] = useState("")
  const [reserveTime, setReserveTime] = useState("")

  // Estados para reportar fuga
  const [isReportingWalkout, setIsReportingWalkout] = useState(false)
  const [walkoutNote, setWalkoutNote] = useState("")

  const [prevTableId, setPrevTableId] = useState<string | null>(null)

  if (table.id !== prevTableId) {
    setPrevTableId(table.id)
    setIsReserving(false)
    setReserveName("")
    setReserveTime("")
    setIsReportingWalkout(false)
    setWalkoutNote("")
  }

  // 1. Calculamos el total leyendo directamente de la mesa
  const calculatedTotal = table.currentTotal || 0;

  // 2. Agrupamos los items por orderId.
  //    - Items del backend (sin orderId) caen en "Orden 1" (primer pedido de la mesa)
  //    - Nuevos pedidos agregados en la misma sesión tienen su propio orderId (UUID)
  const groupedTickets = (table.orders || []).reduce((acc, order) => {
    const tId = order.orderId || "Orden 1"; 
    if (!acc[tId]) {
      acc[tId] = { id: tId, items: [], total: 0 };
    }
    acc[tId].items.push(order);
    acc[tId].total += Number(order.price) || 0;
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
    isReportingWalkout,
    setIsReportingWalkout,
    walkoutNote,
    setWalkoutNote,
    calculatedTotal,
    tickets
  }
}
