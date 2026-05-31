"use client"

import { useState } from "react"
import { Wallet, ArrowDownRight, ArrowUpRight, Lock, Unlock, FileText, Receipt, Banknote, QrCode, CreditCard } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { ExpenseModal } from "./ExpenseModal"
import { OpenShiftModal } from "./OpenShiftModal"
import { CloseShiftModal } from "./CloseShiftModal"
import { ReceiptModal, ReceiptData } from "./ReceiptModal" // <-- IMPORTACIÓN NUEVA
import { usePosStore, Table } from "@/store/posStore"
import { useAuthStore } from "@/store/authStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function CajaDashboard() {
  const user = useAuthStore((state) => state.user) 
  const cashierName = user?.name || user?.username || "Cajero Principal"

  const { 
    isShiftOpen, 
    shiftInitialBalance, 
    transactions, 
    tables, 
    processPayment 
  } = usePosStore()

  const [selectedTableForPayment, setSelectedTableForPayment] = useState<Table | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  
  // ESTADO NUEVO PARA EL RECIBO
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const income = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
  const expenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
  const currentTotal = shiftInitialBalance + income - expenses
  const pendingTables = tables.filter(t => t.status === "Ocupada" && (t.currentTotal || 0) > 0)

  // LOGICA ACTUALIZADA: Generar el ticket antes de cobrar
  const handleConfirmPayment = async (method: "Efectivo" | "QR" | "Tarjeta") => {
    if (!selectedTableForPayment) return
    setIsProcessingPayment(true)
    
    // 1. Preparamos los datos del recibo (Agrupamos productos repetidos)
    const orderItems = selectedTableForPayment.orders || [];
    const groupedOrders = orderItems.reduce((acc, product) => {
      const existing = acc.find(item => item.name === product.name);
      if (existing) {
        existing.qty += 1;
        existing.subtotal += product.price;
      } else {
        acc.push({ name: product.name, qty: 1, subtotal: product.price });
      }
      return acc;
    }, [] as ReceiptData["items"]);

    const newReceipt = {
      tableNumber: selectedTableForPayment.number,
      cashierName: cashierName,
      method: method,
      items: groupedOrders,
      total: selectedTableForPayment.currentTotal || 0,
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    };
    
    // 2. Simulamos proceso de red
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 3. Procesamos el pago en el estado global
    processPayment(selectedTableForPayment.id, method, cashierName)
    
    // 4. Cerramos modal de cobro y abrimos el recibo
    setSelectedTableForPayment(null)
    setIsProcessingPayment(false)
    setReceiptData(newReceipt)
  }

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

      {/* Tarjetas de Resumen Financiero Dinámicas */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ${isShiftOpen ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}>
        <div className="p-6 rounded-[2rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Fondo Inicial</p>
          <p className="text-2xl font-black text-restaurante-oscuro mt-1 relative z-10">Bs. {isShiftOpen ? shiftInitialBalance.toFixed(2) : "0.00"}</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-green-50/50 backdrop-blur-md border border-green-200/50 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest relative z-10 flex items-center gap-1"><ArrowUpRight size={14}/> Ingresos</p>
          <p className="text-2xl font-black text-green-700 mt-1 relative z-10">Bs. {isShiftOpen ? income.toFixed(2) : "0.00"}</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-red-50/50 backdrop-blur-md border border-red-200/50 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest relative z-10 flex items-center gap-1"><ArrowDownRight size={14}/> Gastos</p>
          <p className="text-2xl font-black text-red-700 mt-1 relative z-10">Bs. {isShiftOpen ? expenses.toFixed(2) : "0.00"}</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-restaurante-primario/5 backdrop-blur-md border border-restaurante-primario/20 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-bold text-restaurante-primario uppercase tracking-widest relative z-10 flex items-center gap-1"><Wallet size={14}/> Saldo Total</p>
          <p className="text-3xl font-black text-restaurante-primario tracking-tighter mt-1 relative z-10">Bs. {isShiftOpen ? currentTotal.toFixed(2) : "0.00"}</p>
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
                    onClick={() => setSelectedTableForPayment(table)}
                    className="bg-restaurante-primario/10 text-restaurante-primario hover:bg-restaurante-primario hover:text-white p-3 rounded-2xl transition-colors"
                  >
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
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Cajero</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Método</th>
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
                    <td className="px-4 py-4 text-sm font-medium text-gray-500">{tx.cashierName}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                        tx.method === 'Efectivo' ? 'bg-green-100 text-green-700' :
                        tx.method === 'QR' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {tx.method}
                      </span>
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

      {/* MODAL DE SELECCIÓN DE MÉTODO DE PAGO */}
      <Dialog open={!!selectedTableForPayment} onOpenChange={() => setSelectedTableForPayment(null)}>
        <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[400px] p-8">
          <DialogHeader className="text-center space-y-2 mb-4">
            <DialogTitle className="text-2xl font-black text-restaurante-oscuro">Procesar Pago</DialogTitle>
            <p className="text-sm font-bold text-gray-500">Mesa {selectedTableForPayment?.number} • Total a pagar:</p>
            <p className="text-5xl font-black text-restaurante-primario tracking-tighter py-2">
              Bs. {selectedTableForPayment?.currentTotal?.toFixed(2)}
            </p>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Seleccione Método de Pago</p>
            
            <LoadingButton 
              className="w-full h-14 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-2xl text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-3"
              onClick={() => handleConfirmPayment("Efectivo")}
              isLoading={isProcessingPayment}
            >
              <Banknote size={24} /> Efectivo
            </LoadingButton>

            <LoadingButton 
              className="w-full h-14 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-2xl text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-3"
              onClick={() => handleConfirmPayment("QR")}
              isLoading={isProcessingPayment}
            >
              <QrCode size={24} /> Transferencia QR
            </LoadingButton>

            <LoadingButton 
              className="w-full h-14 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-2xl text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-3"
              onClick={() => handleConfirmPayment("Tarjeta")}
              isLoading={isProcessingPayment}
            >
              <CreditCard size={24} /> Tarjeta / POS
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* NUEVO: MODAL DEL RECIBO TÉRMICO */}
      <ReceiptModal 
        isOpen={!!receiptData} 
        onClose={() => setReceiptData(null)} 
        data={receiptData} 
      />

    </div>
  )
}