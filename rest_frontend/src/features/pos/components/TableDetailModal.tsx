"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useState } from "react"
import { Table } from "./TableMap"
import { TableStatusDetail } from "./TableStatusDetail"
import { TableProductMenu, Product } from "./TableProductMenu"

interface TableDetailProps {
  table: Table | null
  isOpen: boolean
  onClose: () => void
  onUpdateTable: (table: Table) => void
}

export function TableDetailModal({ table, isOpen, onClose, onUpdateTable }: TableDetailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"detail" | "products">("detail")
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  if (!table) return null

  const handleClose = () => {
    setViewMode("detail")
    setSelectedProducts([])
    onClose()
  }

  const handleAction = async (actionName: string) => {
    setIsLoading(true)
    setActionLoading(actionName)
    
    // Simulamos un delay de red
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (table) {
      if (actionName === "Abriendo") {
        onUpdateTable({
          ...table,
          status: "Ocupada",
          customerName: "Cliente Casual",
          activeTime: "0 min",
          currentTotal: 0
        })
        onClose()
      } else if (actionName === "Reservando") {
        onUpdateTable({
          ...table,
          status: "Reservada",
          customerName: "Nueva Reserva",
          activeTime: "12:00 PM"
        })
        onClose()
      } else if (actionName === "Añadiendo pedido") {
        setViewMode("products")
        setSelectedProducts([])
        // No cerramos el modal al añadir un pedido
      } else if (actionName === "Cobrando") {
        onUpdateTable({
          ...table,
          status: "Libre",
          customerName: undefined,
          activeTime: undefined,
          currentTotal: undefined
        })
        onClose()
      } else if (actionName === "Asignando") {
        onUpdateTable({
          ...table,
          status: "Ocupada",
          activeTime: "0 min",
          currentTotal: 0
        })
        onClose()
      } else if (actionName === "Tomando orden") {
        setViewMode("products")
        setSelectedProducts([])
      } else if (actionName === "Confirmar Pedido") {
        const totalAdicional = selectedProducts.reduce((acc: number, p: Product) => acc + p.price, 0)
        onUpdateTable({
          ...table,
          status: "Ocupada",
          customerName: table.customerName || (table.status === "Reservada" ? table.customerName : "Cliente Casual"),
          activeTime: table.activeTime || "0 min",
          currentTotal: (table.currentTotal || 0) + totalAdicional
        })
        setViewMode("detail")
        setSelectedProducts([])
        onClose()
      }
    }

    setIsLoading(false)
    setActionLoading(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[400px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        
        {/* Header Decorativo */}
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