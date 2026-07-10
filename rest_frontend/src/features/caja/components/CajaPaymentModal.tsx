import { Banknote, QrCode, CreditCard } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Table } from "@/store/posStore"

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
  handleConfirmPayment
}: CajaPaymentModalProps) {
  return (
    <Dialog open={!!selectedTableForPayment} onOpenChange={() => setSelectedTableForPayment(null)}>
      <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[550px] max-h-[95vh] overflow-hidden p-6">
        
        <DialogHeader className="text-center space-y-1 mb-2 border-b border-gray-200 pb-2">
          <DialogTitle className="text-xl font-black text-restaurante-oscuro">Procesar Pago</DialogTitle>
          <p className="text-sm font-bold text-gray-500">Cobro a Mesa {selectedTableForPayment?.number}</p>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Calculadora de Vuelto (Solo si es Efectivo) */}
          {paymentMethod === "Efectivo" && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Selector de Moneda */}
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

                {/* Input de Monto Recibido */}
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

              {/* Resultado del Cambio (Vuelto) */}
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

        </div>
      </DialogContent>
    </Dialog>
  )
}
