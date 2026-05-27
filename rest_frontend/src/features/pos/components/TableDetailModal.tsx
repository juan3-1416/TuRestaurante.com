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
  
  // Sincronización directa en fase de renderizado (Recomendación de React moderno)
  const [prevTableId, setPrevTableId] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  if (table && table.id !== prevTableId) {
    setPrevTableId(table.id)
    // Sincronizar mapeando de OrderItem[] a Product[] para resolver la incompatibilidad de tipos
    const mapped = (table.orders || []).map((o): Product => ({
      id: typeof o.productId === 'number' ? o.productId : parseInt(String(o.productId)) || 0,
      name: o.name,
      price: o.price,
      category: "General",
      cartId: o.cartId
    }))
    setSelectedProducts(mapped)
    setViewMode("detail")
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
    } else if (actionName === "Añadiendo pedido" || actionName === "Tomando orden") {
      setViewMode("products")
    } else if (actionName === "Cobrando") {
      updateTable({
        ...table,
        status: "Libre",
        customerName: undefined,
        activeTime: undefined,
        currentTotal: 0,
        orders: []
      })
      onClose()
    } else if (actionName === "Asignando") {
      updateTable({
        ...table,
        status: "Ocupada",
        customerName: table.customerName || "Cliente de Reserva",
        activeTime: "0 min",
        currentTotal: table.currentTotal || 0,
        orders: selectedProducts.map((p): OrderItem => ({
          cartId: p.cartId || crypto.randomUUID(),
          productId: p.id,
          name: p.name,
          price: p.price
        }))
      })
      onClose()
    } else if (actionName === "Confirmar Pedido") {
      const totalCompleto = selectedProducts.reduce((acc, p) => acc + p.price, 0)
      updateTable({
        ...table,
        status: "Ocupada",
        currentTotal: totalCompleto,
        orders: selectedProducts.map((p): OrderItem => ({
          cartId: p.cartId || crypto.randomUUID(),
          productId: p.id,
          name: p.name,
          price: p.price
        }))
      })
      setViewMode("detail")
    }

    setIsLoading(false)
    setActionLoading(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
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
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
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