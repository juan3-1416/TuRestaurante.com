"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useState } from "react"
import { usePosStore, Table, OrderItem } from "@/store/posStore"
import { TableStatusDetail } from "./TableStatusDetail"
import { TableProductMenu, Product } from "./TableProductMenu"

interface TableDetailProps {
  table: Table | null
  isOpen: boolean
  onClose: () => void
}

export function TableDetailModal({ table, isOpen, onClose }: TableDetailProps) {
  const updateTable = usePosStore((state) => state.updateTable)
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"detail" | "products">("detail")
  
  const [prevTableId, setPrevTableId] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  
  // NUEVO ESTADO PARA CONTROLAR SI ESTAMOS EDITANDO O AÑADIENDO
  const [orderMode, setOrderMode] = useState<"edit" | "append">("edit")
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)

  // Solo reiniciamos la vista a "detail" cuando cambiamos de mesa.
  // Ya NO precargamos selectedProducts aquí para no interferir con la lógica de solo lectura.
  if (table && table.id !== prevTableId) {
    setPrevTableId(table.id)
    setViewMode("detail")
    setEditingTicketId(null)
  }

  if (!table) return null

  const handleConfirmReservation = async (name: string, time: string) => {
    setIsLoading(true)
    setActionLoading("Confirmar Reserva")
    await new Promise(resolve => setTimeout(resolve, 600))
    
    updateTable({
      ...table,
      status: "Reservada",
      customerName: name,
      activeTime: time,
      orders: []
    })
    
    setIsLoading(false)
    setActionLoading(null)
    onClose()
  }

  const handleAction = async (actionName: string) => {
    setIsLoading(true)
    setActionLoading(actionName)
    await new Promise(resolve => setTimeout(resolve, 600))
    
    if (actionName === "Abriendo") {
      updateTable({
        ...table,
        status: "Ocupada",
        customerName: "Cliente Casual",
        activeTime: "0 min",
        currentTotal: 0,
        orders: []
      })
      onClose()
    } else if (actionName === "Tomando orden") {
      setOrderMode("append")
      setEditingTicketId(crypto.randomUUID())
      setSelectedProducts([])
      setViewMode("products")
    } else if (actionName.startsWith("Modificar Pedido")) {
      const parts = actionName.split(":");
      const ticketId = parts[1] || "Orden 1"; // Default si no tiene ID antiguo
      setOrderMode("edit")
      setEditingTicketId(ticketId)
      
      const mapped = (table.orders || [])
        .filter(o => (o.orderId || "Orden 1") === ticketId)
        .map((o): Product => ({
          id: typeof o.productId === 'number' ? o.productId : parseInt(String(o.productId)) || 0,
          name: o.name,
          price: o.price,
          category: "General",
          cartId: o.cartId
        }))
      setSelectedProducts(mapped)
      setViewMode("products")
    } else if (actionName === "Agregar Nueva Orden") {
      setOrderMode("append")
      setEditingTicketId(crypto.randomUUID())
      setSelectedProducts([]) // Empezamos con el carrito en blanco para no modificar lo existente
      setViewMode("products")
    } else if (actionName === "Asignando") {
      updateTable({
        ...table,
        status: "Ocupada",
        customerName: table.customerName || "Cliente de Reserva",
        activeTime: "0 min",
        currentTotal: 0,
        orders: []
      })
      onClose()
    } else if (actionName === "Enviar a Cocina" || actionName === "Solo Modificar") {
      
      let finalOrders: OrderItem[] = [];
      const newTicketId = orderMode === "append" ? (editingTicketId || crypto.randomUUID()) : (editingTicketId || "Orden 1");

      const newMappedOrders = selectedProducts.map((p): OrderItem => ({
        cartId: p.cartId || crypto.randomUUID(),
        orderId: newTicketId,
        productId: p.id,
        name: p.name,
        price: p.price
      }));

      // Si es "Nueva Orden", sumamos el historial con lo nuevo. Si es "Modificar", reemplazamos solo ese ticket.
      if (orderMode === "append") {
        finalOrders = [...(table.orders || []), ...newMappedOrders];
      } else {
        const otherOrders = (table.orders || []).filter(o => (o.orderId || "Orden 1") !== newTicketId);
        finalOrders = [...otherOrders, ...newMappedOrders];
      }
      
      const finalTotal = finalOrders.reduce((acc, o) => acc + o.price, 0);

      updateTable({
        ...table,
        status: "Ocupada",
        currentTotal: finalTotal,
        orders: finalOrders
      })
      setViewMode("detail")
    }

    setIsLoading(false)
    setActionLoading(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Se incrementó el max-w a 600px para mayor claridad visual */}
      <DialogContent className={`bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${viewMode === 'products' ? 'sm:max-w-[1000px] h-[85vh]' : 'sm:max-w-[600px] max-h-[90vh]'}`}>
        <div className={`h-32 w-full absolute top-0 left-0 -z-10 opacity-30 ${
          table.status === 'Libre' ? 'bg-linear-to-b from-green-300 to-transparent' :
          table.status === 'Ocupada' ? 'bg-linear-to-b from-red-300 to-transparent' :
          'bg-linear-to-b from-yellow-300 to-transparent'
        }`} />

        {viewMode === "detail" ? (
          <TableStatusDetail 
            table={table}
            isLoading={isLoading}
            actionLoading={actionLoading}
            handleAction={handleAction}
            onConfirmReservation={handleConfirmReservation}
          />
        ) : (
          <TableProductMenu 
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            setViewMode={setViewMode}
            handleAction={handleAction}
            isLoading={isLoading}
            actionLoading={actionLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}