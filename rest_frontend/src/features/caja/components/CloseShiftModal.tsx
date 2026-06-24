"use client"

import { useState } from "react"
import { Lock, FileText, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { useShift } from "../hooks/useShift"
import { useExchangeRate } from "../hooks/useExchangeRate"
import { BackendTransaction } from "../types/cashier"

interface CloseShiftModalProps {
  cashierName: string
}

export function CloseShiftModal({ cashierName }: CloseShiftModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  
  const { shift, closeShift } = useShift()
  const exchangeRate = useExchangeRate()
  
  const transactions: BackendTransaction[] = shift?.transactions || []
  const shiftInitialBalance = shift ? Number(shift.initial_balance) : 0

  // Ingresos y gastos calculados directamente desde el backend (ya calculados en el turno)
  const income = shift ? Number(shift.total_income || 0) : 0
  const expenses = shift ? Number(shift.total_expense || 0) : 0   // OJO: total_expense (sin 's')
  const finalBalance = shiftInitialBalance + income - expenses
  const totalOperations = transactions.length

  // Desglose por método de pago usando el campo correcto del backend: payment_method
  const incomeQR = transactions
    .filter((t) => t.transaction_type === "income" && t.payment_method === "QR")
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const incomeTarjeta = transactions
    .filter((t) => t.transaction_type === "income" && t.payment_method === "Tarjeta")
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const incomeEfectivoBs = transactions
    .filter((t) => t.transaction_type === "income" && t.payment_method === "Efectivo" && (t.currency ?? "BOB") !== "USD")
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const incomeEfectivoUSD_Bs = transactions
    .filter((t) => t.transaction_type === "income" && t.payment_method === "Efectivo" && t.currency === "USD")
    .reduce((acc, t) => acc + Number(t.amount), 0)

  const handleCloseShift = async () => {
    setIsClosing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulamos generar reporte y guardado
    
    // Cerramos el turno y la caja global en el backend
    await closeShift.mutateAsync()
    setIsClosing(false)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <LoadingButton
          className="flex-1 md:flex-none bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-restaurante-primario/20 transition-all hover:-translate-y-1"
        >
          <Lock className="mr-2" size={18} /> Cerrar Turno
        </LoadingButton>
      </DialogTrigger>

      <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem] sm:max-w-[450px] max-h-[95vh] overflow-hidden p-6">
        <DialogHeader className="border-b border-gray-200 pb-3 mb-3">
          <DialogTitle className="text-xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-restaurante-primario/10 text-restaurante-primario">
              <FileText size={20} />
            </div>
            Cierre de Caja
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-0.5">Verifica los totales del turno de <span className="font-bold text-restaurante-oscuro">{cashierName}</span>.</p>
        </DialogHeader>

        <div className="space-y-3">
          {/* Tarjeta de Resumen */}
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-2.5">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-600">
              <span>Fondo Inicial</span>
              <span className="font-mono">Bs. {shiftInitialBalance.toFixed(2)}</span>
            </div>
            
            <div className="pt-2 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-center text-sm font-bold text-green-600 mb-1.5">
                <span className="flex items-center gap-1"><ArrowUpRight size={16}/> Ingresos Totales</span>
                <span className="font-mono">+ Bs. {income.toFixed(2)}</span>
              </div>
              <div className="pl-5 space-y-1 text-[11px] text-gray-500 font-semibold uppercase tracking-wide">
                <div className="flex justify-between">
                  <span>Efectivo (Bs)</span>
                  <span className="font-mono">Bs. {incomeEfectivoBs.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efectivo (USD)</span>
                  <span className="font-mono flex items-center gap-1">
                    Bs. {incomeEfectivoUSD_Bs.toFixed(2)} 
                    <span className="text-green-600/70 normal-case">(${(incomeEfectivoUSD_Bs / exchangeRate).toFixed(2)})</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>QR</span>
                  <span className="font-mono">Bs. {incomeQR.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarjeta</span>
                  <span className="font-mono">Bs. {incomeTarjeta.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-semibold text-red-500 pt-2 border-t border-dashed border-gray-200">
              <span className="flex items-center gap-1"><ArrowDownRight size={16}/> Salidas / Gastos</span>
              <span className="font-mono">- Bs. {expenses.toFixed(2)}</span>
            </div>
            
            <div className="pt-3 mt-1 border-t border-dashed border-gray-300 flex justify-between items-center">
              <span className="text-base font-black text-restaurante-oscuro flex items-center gap-2">
                <Wallet size={18} className="text-restaurante-primario" /> Total Esperado
              </span>
              <span className="text-2xl font-black text-restaurante-primario tracking-tighter">
                Bs. {finalBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-1">
            {totalOperations} movimientos procesados
          </p>
        </div>

        <div className="pt-4 flex gap-3">
          <LoadingButton 
            variant="outline"
            className="flex-1 rounded-xl h-11 border-gray-300 text-gray-600 font-bold hover:bg-gray-50 text-sm"
            onClick={() => setIsOpen(false)}
            disabled={isClosing}
          >
            Cancelar
          </LoadingButton>
          <LoadingButton 
            onClick={handleCloseShift}
            isLoading={isClosing}
            loadingText="Cerrando..."
            className="flex-2 bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-xl h-11 font-bold shadow-md shadow-restaurante-primario/20 text-sm"
          >
            <Lock className="mr-2" size={16} /> Confirmar Cierre
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}