"use client"

import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"
import { Table, OrderItem } from "@/store/posStore"
import { TableStatusDetail } from "./TableStatusDetail"
import { TableProductMenu, Product } from "./TableProductMenu"
import { useTables } from "../hooks/useTables"

interface TableDetailProps {
  table: Table | null
  isOpen: boolean
  onClose: () => void
}

export function TableDetailModal({ table, isOpen, onClose }: TableDetailProps) {
  const { updateTableStatus } = useTables()
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
    
    await updateTableStatus.mutateAsync({
      id: table.id,
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
    
    if (actionName === "Abriendo" || actionName === "Asignando") {
      await updateTableStatus.mutateAsync({
        id: table.id,
        status: "Ocupada",
        customerName: actionName === "Abriendo" ? "Cliente Casual" : (table.customerName || "Cliente de Reserva"),
        orders: [],
        activeTime: "0 min"
      })
      onClose()
    } else if (actionName === "Tomando orden" || actionName === "Agregar Nueva Orden") {
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
          // Items del backend: { id (product_id), name, price, cartId }
          // Items del frontend: { productId, id, name, price, cartId, orderId }
          id: typeof o.id === 'number' ? o.id : (typeof o.productId === 'number' ? o.productId : parseInt(String(o.id || o.productId)) || 0),
          name: o.name,
          price: Number(o.price) || 0,
          category: "General",
          cartId: o.cartId
        }))
      setSelectedProducts(mapped)
      setViewMode("products")
    } else if (actionName === "Enviar a Cocina" || actionName === "Solo Modificar") {
      
      let finalOrders: OrderItem[] = [];

      // Mapeamos los productos NUEVOS del carrito
      // Cada nuevo pedido tiene su propio UUID como orderId (pedido independiente)
      const newMappedOrders = selectedProducts.map((p): OrderItem => ({
        cartId: p.cartId || crypto.randomUUID(),
        orderId: editingTicketId || crypto.randomUUID(),
        productId: p.id,
        id: p.id, // El backend usa prod.get('id') para identificar el producto
        name: p.name,
        price: p.price
      }));

      if (orderMode === "append") {
        // Modo Agregar: los items existentes se mantienen con su orderId original.
        // Los del backend no tienen orderId (quedan como "Orden 1").
        // Los nuevos tienen su propio UUID -> se muestran como un pedido separado.
        const existingWithId = (table.orders || []).map((o): OrderItem => ({
          ...o,
          productId: o.id || o.productId, // Asegurar que el backend recibe el id correcto
          id: o.id || o.productId,
        }));
        finalOrders = [...existingWithId, ...newMappedOrders];
      } else {
        // Modo Editar: reemplazamos solo los items del ticket editado
        const otherOrders = (table.orders || [])
          .filter(o => (o.orderId || "Orden 1") !== (editingTicketId || "Orden 1"))
          .map((o): OrderItem => ({
            ...o,
            productId: o.id || o.productId,
            id: o.id || o.productId,
          }));
        finalOrders = [...otherOrders, ...newMappedOrders];
      }
      
      await updateTableStatus.mutateAsync({
        id: table.id,
        status: "Ocupada",
        customerName: table.customerName || "Cliente Casual",
        orders: finalOrders,
        activeTime: table.activeTime || "0 min"
      })
      
      setViewMode("detail")
    }

    setIsLoading(false)
    setActionLoading(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Se incrementó el max-w a 600px para mayor claridad visual */}
      <DialogContent aria-describedby={undefined} className={`bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${viewMode === 'products' ? 'sm:max-w-[1000px] h-[85vh]' : 'sm:max-w-[600px] max-h-[90vh]'}`}>
        <DialogDescription className="sr-only">Detalles de la mesa y gestión de pedidos</DialogDescription>
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