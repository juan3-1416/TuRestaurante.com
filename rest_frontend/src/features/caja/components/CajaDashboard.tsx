"use client"

import { Wallet, ArrowDownRight, ArrowUpRight, Lock, Unlock, FileText, Receipt, Banknote, QrCode, CreditCard, DollarSign } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { ExpenseModal } from "./ExpenseModal"
import { OpenShiftModal } from "./OpenShiftModal"
import { CloseShiftModal } from "./CloseShiftModal"
import { ReceiptModal } from "./ReceiptModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCaja, EXCHANGE_RATE } from "../hooks/useCaja"

export function CajaDashboard() {
  const {
    cashierName,
    isShiftOpen,
    shiftInitialBalance,
    transactions,
    selectedTableForPayment,
    setSelectedTableForPayment,
    isProcessingPayment,
    receiptData,
    setReceiptData,
    paymentMethod,
    setPaymentMethod,
    paymentCurrency,
    setPaymentCurrency,
    amountReceived,
    setAmountReceived,
    income,
    expenses,
    currentTotal,
    pendingTables,
    tableTotalBs,
    tableTotalUSD,
    changeBs,
    handleOpenPaymentModal,
    handleConfirmPayment
  } = useCaja()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Panel Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
            isShiftOpen ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}>
            {isShiftOpen ? <Unlock size={28} /> : <Lock size={28} />}
          </div>
          <div>
            <h2 className="text-xl font-black text-restaurante-oscuro tracking-tight">
              {isShiftOpen ? `Turno Activo: ${cashierName}` : "Caja Cerrada"}
            </h2>
            <p className={`text-sm font-bold uppercase tracking-widest mt-0.5 ${isShiftOpen ? 'text-green-600' : 'text-red-500'}`}>
              {isShiftOpen ? "Operaciones Habilitadas" : "Requiere Apertura"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {!isShiftOpen ? (
            <OpenShiftModal />
          ) : (
            <>
              <ExpenseModal cashierName={cashierName} />
              <CloseShiftModal cashierName={cashierName} />
            </>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero Dinámicas (Actualizadas con USD) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ${isShiftOpen ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}>
        <div className="p-6 rounded-[2rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Fondo Inicial</p>
          <div className="flex items-end gap-2 mt-1 relative z-10">
            <p className="text-2xl font-black text-restaurante-oscuro">Bs. {isShiftOpen ? shiftInitialBalance.toFixed(2) : "0.00"}</p>
            {isShiftOpen && <span className="text-sm font-bold text-gray-400 mb-1">(${(shiftInitialBalance / EXCHANGE_RATE).toFixed(2)})</span>}
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-green-50/50 backdrop-blur-md border border-green-200/50 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest relative z-10 flex items-center gap-1"><ArrowUpRight size={14}/> Ingresos</p>
          <div className="flex items-end gap-2 mt-1 relative z-10">
            <p className="text-2xl font-black text-green-700">Bs. {isShiftOpen ? income.toFixed(2) : "0.00"}</p>
            {isShiftOpen && <span className="text-sm font-bold text-green-600/60 mb-1">(${(income / EXCHANGE_RATE).toFixed(2)})</span>}
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-red-50/50 backdrop-blur-md border border-red-200/50 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest relative z-10 flex items-center gap-1"><ArrowDownRight size={14}/> Gastos</p>
          <div className="flex items-end gap-2 mt-1 relative z-10">
            <p className="text-2xl font-black text-red-700">Bs. {isShiftOpen ? expenses.toFixed(2) : "0.00"}</p>
            {isShiftOpen && <span className="text-sm font-bold text-red-600/60 mb-1">(${(expenses / EXCHANGE_RATE).toFixed(2)})</span>}
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-restaurante-primario/5 backdrop-blur-md border border-restaurante-primario/20 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-restaurante-primario uppercase tracking-widest relative z-10 flex items-center gap-1"><Wallet size={14}/> Saldo Total</p>
          <div className="flex items-end gap-2 mt-1 relative z-10">
            <p className="text-2xl font-black text-restaurante-primario tracking-tighter">Bs. {isShiftOpen ? currentTotal.toFixed(2) : "0.00"}</p>
            {isShiftOpen && <span className="text-sm font-bold text-restaurante-primario/60 mb-1.5">(${(currentTotal / EXCHANGE_RATE).toFixed(2)})</span>}
          </div>
        </div>
      </div>

      {/* Mesas Pendientes de Cobro */}
      {isShiftOpen && (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-restaurante-oscuro flex items-center gap-2 mb-4 px-2">
            <Receipt className="text-restaurante-primario" size={20} /> Pendientes de Cobro
            <span className="text-xs font-bold text-white bg-restaurante-primario px-3 py-1 rounded-full shadow-sm ml-2">
              {pendingTables.length} mesas
            </span>
          </h3>
          {pendingTables.length === 0 ? (
            <p className="text-sm text-center text-gray-500 italic py-6 bg-white/50 rounded-3xl border border-dashed border-gray-200">
              No hay cuentas pendientes por cobrar en este momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pendingTables.map((table) => (
                <div key={table.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-black text-xl text-restaurante-oscuro">Mesa {table.number}</h4>
                    <p className="text-sm font-bold text-restaurante-primario">Bs. {table.currentTotal?.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => handleOpenPaymentModal(table)}
                    className="bg-restaurante-primario/10 text-restaurante-primario hover:bg-restaurante-primario hover:text-white p-3 rounded-2xl transition-colors">
                    <Receipt size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historial de Movimientos Dinámico */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-lg font-bold text-restaurante-oscuro flex items-center gap-2">
            <FileText className="text-restaurante-primario" size={20} /> Historial del Turno
          </h3>
          <span className="text-xs font-bold text-gray-400 bg-white/50 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
            {isShiftOpen ? transactions.length : 0} movimientos
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Hora</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Método</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Moneda</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {!isShiftOpen ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 font-medium italic">
                    La caja está cerrada. Abre el turno para visualizar los movimientos.
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 font-medium italic">
                    No hay movimientos registrados en este turno.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/40 hover:bg-white/50 transition-colors group">
                    <td className="px-4 py-4 text-sm font-semibold text-gray-500">{tx.time}</td>
                    <td className="px-4 py-4 text-sm font-bold text-restaurante-oscuro">{tx.description}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                        tx.method === 'Efectivo' ? 'bg-green-100 text-green-700' :
                        tx.method === 'QR' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {tx.method}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-500">
                      {tx.currency === "USD" ? (
                        <span className="flex items-center gap-1 text-green-600"><DollarSign size={14}/> USD</span>
                      ) : "Bs."}
                    </td>
                    <td className={`px-4 py-4 text-right font-mono font-bold text-base ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} Bs. {tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE COBRO AVANZADO MAS CALCULO DE CAMBIO*/}
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
                        <span className="text-[9px] text-green-600 normal-case">(1 USD = {EXCHANGE_RATE} Bs)</span>
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

      <ReceiptModal isOpen={!!receiptData} onClose={() => setReceiptData(null)} data={receiptData} />
    </div>
  )
}