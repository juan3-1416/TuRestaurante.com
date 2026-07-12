import { Banknote, QrCode, CreditCard, Receipt, AlertTriangle, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Table } from "@/store/posStore"
import { useState } from "react"

interface CajaPaymentModalProps {
  selectedTableForPayment: Table | null;
  setSelectedTableForPayment: (table: Table | null) => void;
  isProcessingPayment: boolean;
  paymentMethod: "Efectivo" | "QR" | "Tarjeta";
  setPaymentMethod: (method: "Efectivo" | "QR" | "Tarjeta") => void;
  paymentCurrency: "Bs" | "USD";
  setPaymentCurrency: (currency: "Bs" | "USD") => void;
  amountReceived: number | "";
  setAmountReceived: (amount: number | "") => void;
  tableTotalBs: number;
  tableTotalUSD: number;
  changeBs: number;
  exchangeRate: number;
  handleConfirmPayment: () => void;
  isWalkoutMode?: boolean;
  handleResolveWalkout?: () => void;
}

export function CajaPaymentModal({
  selectedTableForPayment,
  setSelectedTableForPayment,
  isProcessingPayment,
  paymentMethod,
  setPaymentMethod,
  paymentCurrency,
  setPaymentCurrency,
  amountReceived,
  setAmountReceived,
  tableTotalBs,
  tableTotalUSD,
  changeBs,
  exchangeRate,
  handleConfirmPayment,
  isWalkoutMode = false,
  handleResolveWalkout
}: CajaPaymentModalProps) {
  const [showOrderDetail, setShowOrderDetail] = useState(true)

  const orders = selectedTableForPayment?.orders || []

  return (
    <Dialog open={!!selectedTableForPayment} onOpenChange={() => setSelectedTableForPayment(null)}>
      <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[800px] max-h-[95vh] overflow-y-auto p-6">
        
        <DialogHeader className={`text-center space-y-1 mb-2 border-b pb-2 ${isWalkoutMode ? 'border-orange-200' : 'border-gray-200'}`}>
          <DialogTitle className={`text-xl font-black ${isWalkoutMode ? 'text-orange-700' : 'text-restaurante-oscuro'}`}>
            {isWalkoutMode ? (
              <span className="flex items-center justify-center gap-2"><AlertTriangle size={20} className="text-orange-500" /> Resolver Fuga</span>
            ) : 'Procesar Pago'}
          </DialogTitle>
          <p className="text-sm font-bold text-gray-500">Mesa {selectedTableForPayment?.number}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Detalles del Pedido / Observación */}
          <div className="space-y-4">

          {/* Modo Walkout: mostrar observación */}
          {isWalkoutMode && selectedTableForPayment?.observationNote && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Observación Registrada</p>
              <p className="text-sm font-semibold text-orange-800">{selectedTableForPayment.observationNote}</p>
            </div>
          )}

          {/* Detalle del Pedido (colapsable) */}
          {orders.length > 0 && (
            <div className="bg-gray-50/80 rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setShowOrderDetail(!showOrderDetail)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100/50 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-gray-600">
                  <Receipt size={16} className="text-restaurante-primario" />
                  Detalle del Pedido ({orders.length} ítem{orders.length !== 1 ? 's' : ''})
                </span>
                {showOrderDetail ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {showOrderDetail && (
                <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
                  {orders.map((item, idx) => (
                    <div key={`${item.cartId}-${idx}`} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-restaurante-primario/10 text-restaurante-primario rounded-md flex items-center justify-center text-[10px] font-black">1</span>
                        <span className="font-medium text-gray-700">{item.name}</span>
                        {item.isTakeaway && (
                          <span className="text-[9px] font-bold bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded">
                            <ShoppingBag size={9} className="inline" /> Llevar
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-gray-600">Bs. {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Total</span>
                    <span className="font-black text-restaurante-primario">Bs. {tableTotalBs.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>

          {/* Columna Derecha: Métodos de Pago y Resumen */}
          <div className="space-y-4 flex flex-col justify-between">
            {isWalkoutMode ? (
            <div className="space-y-3">
              <div className="bg-orange-50/80 py-3 px-4 rounded-2xl border border-orange-200 text-center">
                <p className="text-xs text-orange-600 font-semibold">Al resolver la fuga, la mesa quedará libre y la orden se cancelará con registro permanente.</p>
              </div>
              <LoadingButton
                onClick={handleResolveWalkout}
                isLoading={isProcessingPayment}
                loadingText="Resolviendo..."
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-base font-bold transition-all shadow-lg shadow-orange-500/25"
              >
                <AlertTriangle className="mr-2" size={18} /> Liberar Mesa (Resolver Fuga)
              </LoadingButton>
            </div>
          ) : (
            <>
              {/* Resumen a Pagar */}
              <div className="bg-restaurante-primario/5 py-2 px-4 rounded-2xl border border-restaurante-primario/20 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-restaurante-primario uppercase tracking-widest">Total a Pagar</span>
                <div className="flex items-end gap-3 mt-0">
                  <span className="text-3xl font-black text-restaurante-primario tracking-tighter">
                    Bs. {tableTotalBs.toFixed(2)}
                  </span>
                  <span className="text-base font-bold text-restaurante-primario/60 mb-1">
                    (${tableTotalUSD.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Selección de Método */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">1. Método de Pago</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Efectivo", "QR", "Tarjeta"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 flex flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all border ${
                        paymentMethod === method
                          ? "bg-restaurante-primario text-white border-restaurante-primario shadow-md"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}>
                      {method === "Efectivo" && <Banknote size={18} />}
                      {method === "QR" && <QrCode size={18} />}
                      {method === "Tarjeta" && <CreditCard size={18} />}
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculadora de Vuelto */}
              {paymentMethod === "Efectivo" && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        <span>2. Moneda</span>
                        {paymentCurrency === "USD" && (
                          <span className="text-[9px] text-green-600 normal-case">(1 USD = {exchangeRate} Bs)</span>
                        )}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentCurrency("Bs")}
                          className={`py-1.5 rounded-xl text-sm font-bold transition-all border ${paymentCurrency === "Bs" ? "bg-gray-800 text-white border-gray-800 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                          Bs
                        </button>
                        <button
                          onClick={() => setPaymentCurrency("USD")}
                          className={`py-1.5 rounded-xl text-sm font-bold transition-all border ${paymentCurrency === "USD" ? "bg-green-600 text-white border-green-600 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                          USD
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 relative">
                      <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">3. Monto Entregado</Label>
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-black ${paymentCurrency === "USD" ? "text-green-600" : "text-gray-400"}`}>
                          {paymentCurrency === "USD" ? "$" : "Bs."}
                        </span>
                        <Input 
                          type="number" 
                          className={`h-[36px] pl-9 pr-3 bg-gray-50 border-2 rounded-xl text-lg font-black transition-all ${paymentCurrency === "USD" ? "focus:border-green-500 focus:ring-green-500/20" : "focus:border-gray-800 focus:ring-gray-800/20"}`}
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.valueAsNumber || "")}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                    changeBs < 0 ? "bg-red-50 border-red-200" : "bg-gray-800 border-gray-800 text-white"}`}>
                    <span className={`text-xs font-bold uppercase tracking-widest ${changeBs < 0 ? "text-red-500" : "text-gray-300"}`}>
                      Cambio (Vuelto)
                    </span>
                    <span className={`text-xl font-black font-mono ${changeBs < 0 ? "text-red-600" : "text-white"}`}>
                      {changeBs < 0 ? "Falta dinero" : `Bs. ${changeBs.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Botón Final */}
              <div className="pt-0">
                <LoadingButton 
                  onClick={handleConfirmPayment}
                  isLoading={isProcessingPayment}
                  loadingText="Procesando..."
                  disabled={paymentMethod === "Efectivo" && changeBs < 0}
                  className="w-full h-12 bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-xl text-base font-bold transition-all shadow-lg shadow-restaurante-primario/25 disabled:opacity-50">
                  Confirmar Pago
                </LoadingButton>
              </div>
            </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
