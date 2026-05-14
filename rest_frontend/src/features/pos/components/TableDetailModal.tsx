"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useState } from "react"
import { Table } from "./TableMap"
import { TableStatusDetail } from "./TableStatusDetail"
import { TableProductMenu, Product } from "./TableProductMenu"
import { apiClient } from "@/lib/axios"

interface TableDetailProps {
  table: Table | null
  isOpen: boolean
  onClose: () => void
  onUpdateTable: (table: Table) => void
  onDeleteTable?: (id: string) => void
  onRefetch?: () => void
}

export function TableDetailModal({ table, isOpen, onClose, onUpdateTable, onDeleteTable, onRefetch }: TableDetailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"detail" | "products">("detail")
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  // Estados previos para la sincronización (Render Phase Update)
  const [prevIsOpen, setPrevIsOpen] = useState(false)
  const [prevTableId, setPrevTableId] = useState<string | null>(null)

  // La manera correcta y moderna en React de sincronizar estado sin usar useEffect.
  // Ajustamos el estado directamente durante el renderizado si detectamos que se abrió el modal o cambió la mesa.
  if (isOpen && (!prevIsOpen || table?.id !== prevTableId)) {
    setPrevIsOpen(true)
    setPrevTableId(table?.id || null)
    setSelectedProducts(table?.orders || [])
    setViewMode("detail")
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
  }

  if (!table) return null

  const handleClose = () => {
    setViewMode("detail")
    onClose()
  }

  // Nueva función exclusiva para procesar la reserva con los datos del formulario
  const handleConfirmReservation = async (name: string, time: string) => {
    setIsLoading(true)
    setActionLoading("Confirmar Reserva")
    
    try {
      const res = await apiClient.patch(`/tables/tables/${table.id}/update_status/`, {
        status: "Reservada",
        customerName: name,
        activeTime: time
      })
      onUpdateTable(res.data.table)
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
      setActionLoading(null)
    }
  }

  const handleAction = async (actionName: string) => {
    setIsLoading(true)
    setActionLoading(actionName)
    
    try {
      if (table) {
        if (actionName === "Abriendo") {
          const res = await apiClient.patch(`/tables/tables/${table.id}/update_status/`, {
            status: "Ocupada",
            customerName: "Cliente Casual",
            activeTime: "0 min",
            currentTotal: 0
          })
          onUpdateTable(res.data.table)
          onClose()
        } else if (actionName === "Añadiendo pedido" || actionName === "Tomando orden") {
          setViewMode("products")
        } else if (actionName === "Cobrando") {
          const res = await apiClient.patch(`/tables/tables/${table.id}/update_status/`, {
            status: "Libre"
          })
          onUpdateTable(res.data.table)
          onClose()
        } else if (actionName === "Asignando") {
          const res = await apiClient.patch(`/tables/tables/${table.id}/update_status/`, {
            status: "Ocupada",
            activeTime: "0 min",
            currentTotal: table.currentTotal || 0
          })
          onUpdateTable(res.data.table)
          onClose()
        } else if (actionName === "Confirmar Pedido") {
          const totalCompleto = selectedProducts.reduce((acc: number, p: Product) => acc + p.price, 0)
          const res = await apiClient.patch(`/tables/tables/${table.id}/update_status/`, {
            status: "Ocupada",
            customerName: table.customerName || (table.status === "Reservada" ? table.customerName : "Cliente Casual"),
            activeTime: table.activeTime || "0 min",
            currentTotal: totalCompleto,
            orders: selectedProducts
          })
          onUpdateTable(res.data.table)
          setViewMode("detail")
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
      setActionLoading(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[400px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        
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
            onDeleteTable={onDeleteTable}
            onRefetch={onRefetch}
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