"use client"

import { useState } from "react"
import { Lock, FileText, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { usePosStore } from "@/store/posStore"

interface CloseShiftModalProps {
  cashierName: string
}

export function CloseShiftModal({ cashierName }: CloseShiftModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  
  const { shiftInitialBalance, transactions, toggleShift } = usePosStore()

  // Cálculos del reporte
  const income = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
  const expenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
  const finalBalance = shiftInitialBalance + income - expenses
  const totalOperations = transactions.length

  const handleCloseShift = async () => {
    setIsClosing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulamos generar reporte y guardado
    
    // Cerramos el turno y la caja global (esto limpiará el historial temporal)
    toggleShift(false)
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

      <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem] sm:max-w-[450px] p-8">
        <DialogHeader className="border-b border-gray-200 pb-4 mb-4">
          <DialogTitle className="text-2xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-xl bg-restaurante-primario/10 text-restaurante-primario">
              <FileText size={24} />
            </div>
            Reporte de Cierre de Caja
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Verifica los totales del turno de <span className="font-bold text-restaurante-oscuro">{cashierName}</span> antes de confirmar el cierre.</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tarjeta de Resumen */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-600">
              <span>Fondo Inicial</span>
              <span className="font-mono">Bs. {shiftInitialBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold text-green-600">
              <span className="flex items-center gap-1"><ArrowUpRight size={16}/> Ingresos Totales</span>
              <span className="font-mono">+ Bs. {income.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold text-red-500">
              <span className="flex items-center gap-1"><ArrowDownRight size={16}/> Salidas / Gastos</span>
              <span className="font-mono">- Bs. {expenses.toFixed(2)}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-dashed border-gray-300 flex justify-between items-center">
              <span className="text-base font-black text-restaurante-oscuro flex items-center gap-2">
                <Wallet size={18} className="text-restaurante-primario" /> Total Esperado
              </span>
              <span className="text-2xl font-black text-restaurante-primario tracking-tighter">
                Bs. {finalBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 font-bold uppercase tracking-widest mt-2">
            {totalOperations} movimientos procesados
          </p>
        </div>

        <div className="pt-6 flex gap-3">
          <LoadingButton 
            variant="outline"
            className="flex-1 rounded-xl h-12 border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
            disabled={isClosing}
          >
            Cancelar
          </LoadingButton>
          <LoadingButton 
            onClick={handleCloseShift}
            isLoading={isClosing}
            loadingText="Cerrando..."
            className="flex-1 bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-xl h-12 font-bold shadow-md shadow-restaurante-primario/20"
          >
            <Lock className="mr-2" size={18} /> Confirmar Cierre
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}