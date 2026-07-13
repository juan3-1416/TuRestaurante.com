import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Clock, Receipt, PlusCircle, Coffee, CalendarClock, X, Edit2, AlertTriangle, ShoppingBag } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Table } from "@/store/posStore"
import { useTableStatusDetail } from "../hooks/useTableStatusDetail"
import { TableModal } from "./TableModal"

interface TableStatusDetailProps {
  table: Table
  isLoading: boolean
  actionLoading: string | null
  handleAction: (actionName: string) => void
  onConfirmReservation: (name: string, time: string) => void
  onReportWalkout?: (note: string) => void
}

export function TableStatusDetail({ 
  table, 
  isLoading, 
  actionLoading, 
  handleAction,
  onConfirmReservation,
  onReportWalkout
}: TableStatusDetailProps) {
  
  const {
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
  } = useTableStatusDetail(table)

  const handleConfirmWalkout = () => {
    if (!walkoutNote.trim()) return
    onReportWalkout?.(walkoutNote.trim())
  }

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
                }/>
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

            {/* Formulario de Reportar Fuga */}
            {isReportingWalkout && (
              <div className="text-left space-y-4 animate-in slide-in-from-right-4 duration-300 bg-orange-50 p-5 rounded-3xl border border-orange-200 shadow-sm">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle size={20} />
                  <h3 className="font-black text-lg">Reportar Fuga</h3>
                </div>
                <p className="text-sm text-orange-600/80 font-medium">Describe lo que ocurrió. La mesa quedará bloqueada hasta que caja la resuelva.</p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Motivo / Observación</label>
                  <textarea
                    value={walkoutNote}
                    onChange={(e) => setWalkoutNote(e.target.value)}
                    rows={3}
                    placeholder="Ej: El cliente consumió y salió sin pagar..."
                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-sm font-semibold text-restaurante-oscuro focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                  <Receipt size={16} className="text-restaurante-primario" /> Detalle de Órdenes Confirmadas
                </h4>
                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                  {tickets.length} pedido(s)
                </span>
              </div>
              
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
                              <span className="font-black bg-restaurante-primario/10 text-restaurante-primario w-7 h-7 flex items-center justify-center rounded-lg shrink-0">1</span>
                              <div className="pt-1">
                                <span className="font-semibold text-gray-600 leading-tight text-base">{order.name}</span>
                                {order.isTakeaway && (
                                  <span className="ml-2 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md">
                                    <ShoppingBag size={10} className="inline mr-0.5" />Para Llevar
                                  </span>
                                )}
                              </div>
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

        {/* CASO: OBSERVADA */}
        {table.status === "Observada" && (
          <div className="bg-linear-to-br from-orange-50 to-red-50 p-8 rounded-3xl border border-orange-200 space-y-5 animate-in zoom-in-95 duration-500 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <AlertTriangle size={28} />
              </div>
              <div>
                <p className="text-xs font-black text-orange-600/70 uppercase tracking-widest">Mesa Bloqueada</p>
                <p className="text-2xl font-black text-restaurante-oscuro">Fuga Reportada</p>
              </div>
            </div>
            
            {table.observationNote && (
              <div className="bg-white/80 p-4 rounded-2xl border border-orange-100">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Observación registrada</p>
                <p className="text-sm font-semibold text-gray-700">{table.observationNote}</p>
              </div>
            )}

            <div className="bg-orange-100/60 p-4 rounded-2xl flex items-start gap-3">
              <Receipt size={18} className="text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-800">Pendiente de resolución</p>
                <p className="text-xs text-orange-600/80 mt-0.5">El cajero debe revisar y resolver esta observación para liberar la mesa.</p>
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

      {/* FOOTER DE BOTONES */}
      <div className="p-6 bg-gray-50/80 border-t border-gray-100 shrink-0">
        <div className="w-full space-y-3">
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

          {table.status === "Ocupada" && !isReportingWalkout && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <LoadingButton 
                className="col-span-2 bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-restaurante-primario/20 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Agregar Nueva Orden")}
                isLoading={isLoading && actionLoading === "Agregar Nueva Orden"}
              >
                <PlusCircle className="mr-2" size={18} /> Agregar Pedido
              </LoadingButton>
              {/* Módulo 2: Cancelar apertura si aún no hay pedidos */}
              {tickets.length === 0 && (
                <LoadingButton
                  variant="outline"
                  className="col-span-1 rounded-2xl h-11 border-red-300 text-red-500 font-bold hover:bg-red-50 transition-all text-sm"
                  onClick={() => handleAction("Cancelar Apertura")}
                  isLoading={isLoading && actionLoading === "Cancelar Apertura"}
                >
                  <X className="mr-1.5" size={15} /> Cerrar Mesa
                </LoadingButton>
              )}
              {/* Módulo 3: Reportar fuga */}
              {onReportWalkout && (
                <LoadingButton
                  variant="outline"
                  className={`rounded-2xl h-11 border-orange-400 text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm ${tickets.length === 0 ? "col-span-1" : "col-span-2"}`}
                  onClick={() => setIsReportingWalkout(true)}
                >
                  <AlertTriangle className="mr-1.5" size={15} /> Reportar Fuga
                </LoadingButton>
              )}
            </div>
          )}

          {/* Footer cuando está en modo de reporte de fuga */}
          {table.status === "Ocupada" && isReportingWalkout && (
            <div className="flex gap-3 w-full">
              <LoadingButton
                variant="outline"
                className="flex-1 rounded-2xl h-12 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-all"
                onClick={() => { setIsReportingWalkout(false); setWalkoutNote("") }}
                disabled={isLoading}
              >
                <X className="mr-2" size={18} /> Cancelar
              </LoadingButton>
              <LoadingButton
                className="flex-2 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                onClick={handleConfirmWalkout}
                isLoading={isLoading && actionLoading === "Reportar Fuga"}
                disabled={!walkoutNote.trim()}
              >
                <AlertTriangle className="mr-2" size={18} /> Confirmar Fuga
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