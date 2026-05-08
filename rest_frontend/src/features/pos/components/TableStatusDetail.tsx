import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Clock, Receipt, CreditCard, PlusCircle, UserCheck, Coffee, Trash2, CalendarClock, X } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Table } from "./TableMap"
import { Product } from "./TableProductMenu"
import { Dispatch, SetStateAction, useState } from "react"

interface TableStatusDetailProps {
  table: Table
  isLoading: boolean
  actionLoading: string | null
  handleAction: (actionName: string) => void
  selectedProducts: Product[]
  setSelectedProducts: Dispatch<SetStateAction<Product[]>>
  onConfirmReservation: (name: string, time: string) => void
}

export function TableStatusDetail({ 
  table, 
  isLoading, 
  actionLoading, 
  handleAction,
  selectedProducts,
  setSelectedProducts,
  onConfirmReservation
}: TableStatusDetailProps) {
  
  // Estados para el formulario de reserva
  const [isReserving, setIsReserving] = useState(false)
  const [reserveName, setReserveName] = useState("")
  const [reserveTime, setReserveTime] = useState("")


  const handleRemoveProduct = (cartIdToRemove: string | undefined) => {
    if (!cartIdToRemove) return;
    setSelectedProducts(selectedProducts.filter(p => p.cartId !== cartIdToRemove));
  }

  const calculatedTotal = selectedProducts.reduce((acc, product) => acc + product.price, 0);

  const groupedOrders = selectedProducts.reduce((acc, product) => {
    const existing = acc.find(item => item.id === product.id);
    if (existing) {
      existing.qty += 1;
      existing.subtotal += product.price;
      existing.cartIds.push(product.cartId!); 
    } else {
      acc.push({
        id: product.id,
        name: product.name,
        qty: 1,
        subtotal: product.price,
        cartIds: [product.cartId!]
      });
    }
    return acc;
  }, [] as Array<{ id: number, name: string, qty: number, subtotal: number, cartIds: string[] }>);

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
                {table.status === 'Libre' ? 'Disponible' : 
                 table.status === 'Ocupada' ? 'En Uso' : 
                 'Reservada'}
              </span>
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
              <p className="text-xl font-black text-restaurante-oscuro relative z-10">{table.customerName}</p>
              <div className="flex items-center text-xs text-gray-500 mt-2 font-bold w-max px-2 py-1 rounded-md relative z-10">
                <Clock size={12} className="mr-1 text-restaurante-primario" /> Tiempo: {table.activeTime}
              </div>
            </div>

            <div className="space-y-3 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                  <Receipt size={16} className="text-restaurante-primario" /> Detalle del Pedido
                </h4>
                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                  {selectedProducts.length} items
                </span>
              </div>
              
              <div className="space-y-2">
                {groupedOrders.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 italic py-6 bg-white rounded-2xl border border-dashed border-gray-200">
                    Aún no hay productos en la orden.
                  </p>
                ) : (
                  groupedOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="text-sm flex items-center gap-2">
                        <span className="font-black bg-restaurante-primario/10 text-restaurante-primario w-6 h-6 flex items-center justify-center rounded-lg">{order.qty}</span>
                        <span className="font-semibold text-restaurante-oscuro">{order.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-gray-600">Bs. {order.subtotal.toFixed(2)}</span>
                        <button 
                          onClick={() => handleRemoveProduct(order.cartIds[0])}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 p-1.5 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="pt-4 mt-2 border-t border-dashed border-gray-300 flex justify-between items-center">
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total a Pagar</span>
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
              <p className="text-xs font-black text-yellow-600/60 uppercase tracking-widest mb-1">Reserva a las {table.activeTime}</p>
              <p className="text-3xl font-black text-restaurante-oscuro">{table.customerName}</p>
            </div>
            <div className="inline-block bg-yellow-100 px-4 py-2 rounded-xl">
              <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Llegada estimada
              </p>
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
                    placeholder="Ej. Juan Pérez"
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

      <div className="p-6 bg-gray-50/80 border-t border-gray-100 shrink-0">
        <div className="w-full">
          {/* BOTONES LIBRE NORMAL */}
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

          {/* BOTONES FORMULARIO DE RESERVA */}
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

          {/* BOTONES OCUPADA */}
          {table.status === "Ocupada" && (
            <div className="flex gap-3 w-full">
              <LoadingButton 
                variant="outline"
                className="flex-1 rounded-2xl h-12 border-restaurante-primario text-restaurante-primario font-bold hover:bg-restaurante-primario/5 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Añadiendo pedido")}
                isLoading={isLoading && actionLoading === "Añadiendo pedido"}
              >
                <PlusCircle className="mr-2" size={18} /> Agregar Producto
              </LoadingButton>
              <LoadingButton 
                className="flex-2 bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-restaurante-primario/20 transition-all hover:-translate-y-1 disabled:opacity-50"
                onClick={() => handleAction("Cobrando")}
                isLoading={isLoading && actionLoading === "Cobrando"}
                disabled={selectedProducts.length === 0}
              >
                <CreditCard className="mr-2" size={20} /> Cobrar Bs. {calculatedTotal.toFixed(2)}
              </LoadingButton>
            </div>
          )}

          {/* BOTONES RESERVADA */}
          {table.status === "Reservada" && (
            <div className="flex gap-3 w-full">
              <LoadingButton 
                variant="outline"
                className="flex-1 rounded-2xl h-12 border-yellow-500 text-yellow-600 font-bold hover:bg-yellow-50 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Asignando")}
                isLoading={isLoading && actionLoading === "Asignando"}
              >
                <UserCheck className="mr-2" size={18} /> Marcar Llegada
              </LoadingButton>
              <LoadingButton 
                className="flex-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl h-12 text-md font-bold shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-1"
                onClick={() => handleAction("Tomando orden")}
                isLoading={isLoading && actionLoading === "Tomando orden"}
              >
                <Receipt className="mr-2" size={18} /> Tomar Orden
              </LoadingButton>
            </div>
          )}
        </div>
      </div>
    </>
  )
}