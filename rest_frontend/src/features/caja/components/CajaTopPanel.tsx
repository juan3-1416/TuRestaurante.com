import { Lock, Unlock } from "lucide-react"
import { ExpenseModal } from "./ExpenseModal"
import { OpenShiftModal } from "./OpenShiftModal"
import { CloseShiftModal } from "./CloseShiftModal"

interface CajaTopPanelProps {
  isShiftOpen: boolean;
  cashierName: string;
}

export function CajaTopPanel({ isShiftOpen, cashierName }: CajaTopPanelProps) {
  return (
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
            <ExpenseModal />
            <CloseShiftModal cashierName={cashierName} />
          </>
        )}
      </div>
    </div>
  )
}
