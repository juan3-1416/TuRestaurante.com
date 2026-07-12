import { Lock, Unlock, Clock } from "lucide-react"
import { ExpenseModal } from "./ExpenseModal"
import { OpenShiftModal } from "./OpenShiftModal"
import { CloseShiftModal } from "./CloseShiftModal"
import { useEffect, useState } from "react"

interface CajaTopPanelProps {
  isShiftOpen: boolean;
  cashierName: string;
  shift?: { start_time?: string; opened_at?: string; created_at?: string; }; // Añadido para acceder a la info del turno de caja
}

function calcDuration(start: string): string {
  const diffMs = new Date().getTime() - new Date(start).getTime()
  if (diffMs < 0) return "0h 0m"
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function CajaTopPanel({ isShiftOpen, cashierName, shift }: CajaTopPanelProps) {
  const startTime = shift?.start_time || shift?.opened_at || shift?.created_at;
  const [duration, setDuration] = useState(startTime ? calcDuration(startTime) : "0h 0m")

  useEffect(() => {
    if (!isShiftOpen || !startTime) return;
    
    // Actualizar cada minuto
    const interval = setInterval(() => {
      setDuration(calcDuration(startTime));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isShiftOpen, startTime]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/20 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
          isShiftOpen ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          {isShiftOpen ? <Unlock size={28} /> : <Lock size={28} />}
        </div>
        
        <div className="flex gap-8">
          <div>
            <h2 className="text-xl font-black text-restaurante-oscuro tracking-tight">
              {isShiftOpen ? `Turno Activo: ${cashierName}` : "Caja Cerrada"}
            </h2>
            <p className={`text-sm font-bold uppercase tracking-widest mt-0.5 ${isShiftOpen ? 'text-green-600' : 'text-red-500'}`}>
              {isShiftOpen ? "Operaciones Habilitadas" : "Requiere Apertura"}
            </p>
          </div>

          {isShiftOpen && startTime && (
            <div className="hidden sm:flex items-center gap-6 border-l border-gray-200 pl-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                  <Clock size={12}/> Inicio
                </p>
                <p className="font-bold text-restaurante-oscuro">{formatTime(startTime)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                  Transcurrido
                </p>
                <p className="font-black text-blue-600">{duration}</p>
              </div>
            </div>
          )}
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
