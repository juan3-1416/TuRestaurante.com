import { Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { EXCHANGE_RATE } from "../hooks/useCaja"

interface CajaSummaryCardsProps {
  isShiftOpen: boolean;
  shiftInitialBalance: number;
  income: number;
  expenses: number;
  currentTotal: number;
}

export function CajaSummaryCards({ isShiftOpen, shiftInitialBalance, income, expenses, currentTotal }: CajaSummaryCardsProps) {
  return (
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
  )
}
