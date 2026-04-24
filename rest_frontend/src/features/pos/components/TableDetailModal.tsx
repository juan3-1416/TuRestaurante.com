"use client"

import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Users, Clock, Receipt, CreditCard, PlusCircle, UserCheck, Coffee } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { useState } from "react"
import { Table } from "./TableMap"

interface TableDetailProps {
  table: Table | null
  isOpen: boolean
  onClose: () => void
  onUpdateTable: (table: Table) => void
}

export function TableDetailModal({ table, isOpen, onClose, onUpdateTable }: TableDetailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  if (!table) return null

  // Simulación de productos en una mesa ocupada
  const mockOrders = [
    { id: 1, name: "Hamburguesa Doble", qty: 2, subtotal: 130.00 },
    { id: 2, name: "Coca-Cola 2L", qty: 1, subtotal: 25.00 },
  ]

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
      } else if (actionName === "Añadiendo pedido") {
        onUpdateTable({
          ...table,
          currentTotal: (table.currentTotal || 0) + 45.50
        })
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
        onUpdateTable({
          ...table,
          status: "Ocupada",
          customerName: table.status === "Reservada" ? table.customerName : "Cliente Casual",
          activeTime: "0 min",
          currentTotal: 0
        })
        onClose()
      }
    }

    setIsLoading(false)
    setActionLoading(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[400px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        
        {/* Header Decorativo */}
        <div className={`h-32 w-full absolute top-0 left-0 -z-10 opacity-30 ${
          table.status === 'Libre' ? 'bg-linear-to-b from-green-300 to-transparent' :
          table.status === 'Ocupada' ? 'bg-linear-to-b from-red-300 to-transparent' :
          'bg-linear-to-b from-yellow-300 to-transparent'
        }`} />

        <div className="p-8 pb-4 shrink-0">
          <DialogHeader className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <DialogTitle className="text-4xl font-black text-restaurante-oscuro tracking-tighter flex items-center gap-2">
                  Mesa {table.number}
                </DialogTitle>
                <div className="flex items-center text-gray-500 font-bold text-sm bg-white/50 w-max px-3 py-1 rounded-lg border border-white">
                  <Users size={16} className="mr-2 text-restaurante-primario" /> 
                  Capacidad para {table.capacity} personas
                </div>
              </div>
              
              {/* Badge animado */}
              <div className="relative">
                <div className={`absolute -inset-1 rounded-full blur opacity-40 animate-pulse ${
                  table.status === 'Libre' ? 'bg-green-400' :
                  table.status === 'Ocupada' ? 'bg-red-400' :
                  'bg-yellow-400'
                }`}></div>
                <span className={`relative px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm flex items-center gap-1 ${
                  table.status === 'Libre' ? 'bg-green-100 text-green-700 border-green-200' :
                  table.status === 'Ocupada' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    table.status === 'Libre' ? 'bg-green-500' :
                    table.status === 'Ocupada' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></span>
                  {table.status}
                </span>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-8 pb-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* CASO: OCUPADA - Mostrar Pedido */}
            {table.status === "Ocupada" && (
              <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-restaurante-primario/5 rounded-bl-full z-0"></div>
                  <p className="text-[10px] font-black text-restaurante-primario/60 uppercase tracking-widest mb-1 relative z-10">Cliente en Mesa</p>
                  <p className="text-xl font-black text-restaurante-oscuro relative z-10">{table.customerName}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-2 font-bold w-max px-2 py-1 rounded-md relative z-10">
                    <Clock size={12} className="mr-1 text-restaurante-primario" /> Tiempo: {table.activeTime}
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                    <Receipt size={16} className="text-restaurante-primario" /> Detalle del Pedido
                  </h4>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {mockOrders.map(order => (
                      <div key={order.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-sm flex items-center gap-2">
                          <span className="font-black bg-restaurante-primario/10 text-restaurante-primario w-6 h-6 flex items-center justify-center rounded-lg">{order.qty}</span>
                          <span className="font-semibold text-restaurante-oscuro">{order.name}</span>
                        </div>
                        <span className="font-mono font-bold text-gray-600">Bs. {order.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 mt-2 border-t border-dashed border-gray-300 flex justify-between items-center">
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total a Pagar</span>
                    <span className="text-3xl font-black text-restaurante-primario tracking-tighter">
                      Bs. {table.currentTotal?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CASO: RESERVADA */}
            {table.status === "Reservada" && (
              <div className="bg-linear-to-br from-yellow-50 to-white p-8 rounded-3xl border border-yellow-200 text-center space-y-4 animate-in zoom-in-95 duration-500 shadow-sm">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-2">
                  <Clock size={32} />
                </div>
                <div>
                  <p className="text-xs font-black text-yellow-600/60 uppercase tracking-widest mb-1">Reserva a las {table.activeTime}</p>
                  <p className="text-3xl font-black text-restaurante-oscuro">{table.customerName}</p>
                </div>
                <div className="inline-block bg-yellow-100 px-4 py-2 rounded-xl">
                  <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    Llegada estimada en 15 min
                  </p>
                </div>
              </div>
            )}

            {/* CASO: LIBRE */}
            {table.status === "Libre" && (
              <div className="py-12 text-center space-y-5 animate-in zoom-in-95 duration-500">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-24 h-24 bg-linear-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 border border-green-200 shadow-inner">
                    <Coffee size={40} className="text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black text-restaurante-oscuro">¿Abrir esta mesa?</p>
                  <p className="text-sm text-gray-500 font-medium max-w-[250px] mx-auto">
                    Inicia un nuevo servicio y comienza a tomar la orden para los comensales.
                  </p>
                </div>
              </div>
            )}
          </div>

        <div className="p-6 bg-gray-50/80 border-t border-gray-100 shrink-0">
          <DialogFooter className="sm:justify-between gap-3 w-full flex-col sm:flex-row">
            {table.status === "Libre" && (
              <div className="flex gap-3 w-full">
                <LoadingButton 
                  variant="outline"
                  className="flex-1 rounded-2xl h-14 border-green-600 text-green-700 font-bold hover:bg-green-50 transition-all hover:-translate-y-1"
                  onClick={() => handleAction("Abriendo")}
                  isLoading={isLoading && actionLoading === "Abriendo"}
                >
                  <PlusCircle className="mr-2" size={20} /> Abrir Mesa
                </LoadingButton>
                <LoadingButton 
                  className="flex-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-green-600/20 transition-all hover:-translate-y-1"
                  onClick={() => handleAction("Tomando orden")}
                  isLoading={isLoading && actionLoading === "Tomando orden"}
                >
                  <Receipt className="mr-2" size={20} /> Tomar Orden
                </LoadingButton>
              </div>
            )}
            {table.status === "Ocupada" && (
              <div className="flex gap-3 w-full">
                <LoadingButton 
                  variant="outline"
                  className="flex-1 rounded-2xl h-14 border-restaurante-primario text-restaurante-primario font-bold hover:bg-restaurante-primario/5 transition-all hover:-translate-y-1"
                  onClick={() => handleAction("Añadiendo pedido")}
                  isLoading={isLoading && actionLoading === "Añadiendo pedido"}
                >
                  <PlusCircle className="mr-2" size={20} /> Agregar Producto
                </LoadingButton>
                <LoadingButton 
                  className="flex-2 bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-restaurante-primario/20 transition-all hover:-translate-y-1"
                  onClick={() => handleAction("Cobrando")}
                  isLoading={isLoading && actionLoading === "Cobrando"}
                >
                  <CreditCard className="mr-2" size={20} /> Cobrar Cuenta
                </LoadingButton>
              </div>
            )}
            {table.status === "Reservada" && (
              <div className="flex gap-3 w-full">
                <LoadingButton 
                  variant="outline"
                  className="flex-1 rounded-2xl h-14 border-yellow-500 text-yellow-600 font-bold hover:bg-yellow-50 transition-all hover:-translate-y-1"
                  onClick={() => handleAction("Asignando")}
                  isLoading={isLoading && actionLoading === "Asignando"}
                >
                  <UserCheck className="mr-2" size={20} /> Marcar Llegada
                </LoadingButton>
                <LoadingButton 
                  className="flex-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-1"
                  onClick={() => handleAction("Tomando orden")}
                  isLoading={isLoading && actionLoading === "Tomando orden"}
                >
                  <Receipt className="mr-2" size={20} /> Tomar Orden
                </LoadingButton>
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}