import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Clock, Receipt, PlusCircle, Coffee, CalendarClock, X, Edit2 } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Table, OrderItem } from "@/store/posStore"
import { useState } from "react"
import { TableModal } from "./TableModal"

interface TableStatusDetailProps {
  table: Table
  isLoading: boolean
  actionLoading: string | null
  handleAction: (actionName: string) => void
  onConfirmReservation: (name: string, time: string) => void
}

export function TableStatusDetail({ 
  table, 
  isLoading, 
  actionLoading, 
  handleAction,
  onConfirmReservation
}: TableStatusDetailProps) {
  
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

  // 2. Agrupamos por tickets (orderId)
  const groupedTickets = (table.orders || []).reduce((acc, order) => {
    const tId = order.orderId || "Orden 1"; // Para soporte de datos antiguos
    if (!acc[tId]) {
      acc[tId] = { id: tId, items: [], total: 0 };
    }
    acc[tId].items.push(order);
    acc[tId].total += order.price;
    return acc;
  }, {} as Record<string, { id: string, items: OrderItem[], total: number }>);
  
  const tickets = Object.values(groupedTickets);

  return (
    <>
      <div className="p-8 pb-4 shrink-0">
        <DialogHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-4xl font-black text-restaurante-oscuro tracking-tighter flex items-center gap-2">
                Mesa {table.number}
              </DialogTitle>
              <div className="flex items-center text-gray-500 font-bold text-sm bg-white/50 w-max px-3 py-1 rounded-lg border border-white">
                <Users size={16} className="mr-2 text-restaurante-primario" /> 
                Capacidad: {table.capacity} personas
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TableModal 
                tableToEdit={{ id: table.id, number: table.number, capacity: table.capacity }}
                trigger={
                  <button className="px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-gray-500 hover:text-restaurante-primario border border-gray-200/50 shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    <Edit2 size={12} /> Editar
                  </button>
                }
              />
            </div>
          </div>
        </DialogHeader>
      </div>

      <div className="px-8 pb-6 space-y-6 overflow-y-auto flex-1 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* CASO: OCUPADA */}
        {table.status === "Ocupada" && (
          <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-restaurante-primario/5 rounded-bl-full z-0"></div>
              <p className="text-[10px] font-black text-restaurante-primario/60 uppercase tracking-widest mb-1 relative z-10">Cliente en Mesa</p>
              <p className="text-xl font-black text-restaurante-oscuro relative z-10">{table.customerName || "Cliente Casual"}</p>
              <div className="flex items-center text-xs text-gray-500 mt-2 font-bold w-max px-2 py-1 rounded-md relative z-10">
                <Clock size={12} className="mr-1 text-restaurante-primario" /> Tiempo: {table.activeTime || "0 min"}
              </div>
            </div>

            <div className="space-y-3 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                  <Receipt size={16} className="text-restaurante-primario" /> Detalle de Órdenes Confirmadas
                </h4>
                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                  {tickets.length} pedido(s)
                </span>
              </div>
              
              {/* Contenedor vertical para tickets independientes sin scroll interno */}
              {tickets.length === 0 ? (
                <p className="text-sm text-center text-gray-400 italic py-6 bg-white rounded-2xl border border-dashed border-gray-200">
                  Aún no hay productos confirmados en la mesa.
                </p>
              ) : (
                <div className="flex flex-col gap-5 pb-4">
                  {tickets.map((ticket, tIdx) => (
                    <div key={ticket.id} className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col relative">
                      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                         <span className="font-black text-lg text-gray-700">Pedido {tIdx + 1}</span>
                         <button 
                           onClick={() => handleAction(`Modificar Pedido:${ticket.id}`)}
                           className="text-sm flex items-center gap-1.5 text-restaurante-primario hover:text-restaurante-oscuro bg-restaurante-primario/10 hover:bg-restaurante-primario/20 px-3 py-1.5 rounded-xl font-bold transition-colors"
                         >
                           <Edit2 size={14} /> Modificar
                         </button>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        {ticket.items.map((order, idx) => (
                          <div key={`${order.cartId || order.productId}-${idx}`} className="flex justify-between items-start text-sm border-b border-dashed border-gray-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                            <div className="flex items-start gap-3">
                              <span className="font-black bg-restaurante-primario/10 text-restaurante-primario w-7 h-7 flex items-center justify-center rounded-lg">1</span>
                              <span className="font-semibold text-gray-600 leading-tight pt-1 text-base">{order.name}</span>
                            </div>
                            <span className="font-mono font-bold text-gray-500 whitespace-nowrap pt-1 text-base">Bs. {order.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/80 -mx-5 -mb-5 px-5 py-4 rounded-b-3xl">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Subtotal Pedido {tIdx + 1}</span>
                        <span className="font-black text-2xl text-restaurante-oscuro">Bs. {ticket.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 mt-2 border-t border-dashed border-gray-300 flex justify-between items-center">
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total Acumulado</span>
                <span className="text-3xl font-black text-restaurante-primario tracking-tighter">
                  Bs. {calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CASO: RESERVADA */}
        {table.status === "Reservada" && (
          <div className="bg-linear-to-br from-yellow-50 to-white p-8 rounded-3xl border border-yellow-200 text-center space-y-4 animate-in zoom-in-95 duration-500 shadow-sm">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-2">
              <Clock size={30} />
            </div>
            <div>
              <p className="text-xs font-black text-yellow-600/60 uppercase tracking-widest mb-1">Reserva para las {table.activeTime}</p>
              <p className="text-3xl font-black text-restaurante-oscuro">{table.customerName}</p>
            </div>
          </div>
        )}

        {/* CASO: LIBRE */}
        {table.status === "Libre" && (
          <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-500">
            {!isReserving ? (
              <>
                <div className="relative w-24 h-24 mx-auto mt-6">
                  <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-24 h-24 bg-linear-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 border border-green-200 shadow-inner">
                    <Coffee size={40} className="text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black text-restaurante-oscuro">¿Abrir esta mesa?</p>
                </div>
              </>
            ) : (
              <div className="text-left space-y-5 animate-in slide-in-from-right-4 duration-300 bg-white/50 p-6 rounded-3xl border border-white shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-yellow-600">
                  <CalendarClock size={22} />
                  <h3 className="font-black text-xl text-restaurante-oscuro">Datos de Reserva</h3>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-semibold text-restaurante-oscuro focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Hora Estimada</label>
                  <input
                    type="time"
                    value={reserveTime}
                    onChange={(e) => setReserveTime(e.target.value)}
                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-semibold text-restaurante-oscuro focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER DE BOTONES AJUSTADO */}
      <div className="p-6 bg-gray-50/80 border-t border-gray-100 shrink-0">
        <div className="w-full">
          {table.status === "Libre" && !isReserving && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <LoadingButton
                variant="outline"
                className="rounded-2xl h-12 border-green-600 text-green-700 font-bold hover:bg-green-50 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Abriendo")}
                isLoading={isLoading && actionLoading === "Abriendo"}
              >
                <PlusCircle className="mr-2" size={18} /> Abrir
              </LoadingButton>
              <LoadingButton 
                variant="outline"
                className="rounded-2xl h-12 border-yellow-500 text-yellow-600 font-bold hover:bg-yellow-50 transition-all hover:-translate-y-1"
                onClick={() => setIsReserving(true)}
              >
                <Clock className="mr-2" size={18} /> Reservar
              </LoadingButton>
              <LoadingButton 
                className="col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-green-600/20 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Tomando orden")}
                isLoading={isLoading && actionLoading === "Tomando orden"}
              >
                <Receipt className="mr-2" size={18} /> Tomar Orden
              </LoadingButton>
            </div>
          )}

          {table.status === "Libre" && isReserving && (
            <div className="flex gap-3 w-full">
              <LoadingButton 
                variant="outline"
                className="flex-1 rounded-2xl h-12 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-all"
                onClick={() => setIsReserving(false)}
                disabled={isLoading}
              >
                <X className="mr-2" size={18} /> Cancelar
              </LoadingButton>
              <LoadingButton 
                className="flex-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-1 disabled:opacity-50"
                onClick={() => onConfirmReservation(reserveName, reserveTime)}
                isLoading={isLoading && actionLoading === "Confirmar Reserva"}
                disabled={!reserveName.trim() || !reserveTime}
              >
                <CalendarClock className="mr-2" size={18} /> Guardar
              </LoadingButton>
            </div>
          )}

          {table.status === "Ocupada" && (
            <div className="flex w-full">
              <LoadingButton 
                className="w-full bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-restaurante-primario/20 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Agregar Nueva Orden")}
                isLoading={isLoading && actionLoading === "Agregar Nueva Orden"}
              >
                <PlusCircle className="mr-2" size={18} /> Agregar Pedido
              </LoadingButton>
            </div>
          )}

          {table.status === "Reservada" && (
            <div className="w-full">
              <LoadingButton 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Asignando")}
                isLoading={isLoading && actionLoading === "Asignando"}
              >
                <PlusCircle className="mr-2" size={18} /> Asignar a Mesa (Abrir)
              </LoadingButton>
            </div>
          )}
        </div>
      </div>
    </>
  )
}