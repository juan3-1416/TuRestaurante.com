import { TrendingUp, Play, Square, Clock } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { EmployeeShift } from "../hooks/useEmployeeShift"

interface TurnosActiveShiftCardProps {
  activeShift: EmployeeShift | null
  isLoading: boolean
  isPendingStart: boolean
  handleStartShift: () => void
  onOpenEndModal: () => void
}

function formatDuration(startTime: string): string {
  const start = new Date(startTime)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "—"
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
}

export function TurnosActiveShiftCard({
  activeShift,
  isLoading,
  isPendingStart,
  handleStartShift,
  onOpenEndModal,
}: TurnosActiveShiftCardProps) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="w-8 h-8 border-4 border-restaurante-primario border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (activeShift) {
    return (
      <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-[2.5rem] p-8 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30" />
              </div>
              <span className="text-xs font-black text-green-600/70 uppercase tracking-widest">Turno Activo</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inicio</p>
                <p className="text-2xl font-black text-restaurante-oscuro">{formatTime(activeShift.start_time)}</p>
                <p className="text-xs text-gray-400 font-medium">{formatDate(activeShift.start_time)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duración</p>
                <p className="text-2xl font-black text-restaurante-oscuro">{formatDuration(activeShift.start_time)}</p>
                <p className="text-xs text-gray-400 font-medium">transcurrido</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-100/60 px-4 py-2 rounded-2xl w-max">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-sm font-bold text-green-700">
                Ingresos generados: <span className="font-black">Bs. {activeShift.generated_income.toFixed(2)}</span>
              </span>
            </div>
          </div>
          <LoadingButton
            onClick={onOpenEndModal}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-500/25 transition-all hover:-translate-y-1 flex items-center gap-2 shrink-0"
          >
            <Square size={18} /> Finalizar Turno
          </LoadingButton>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-10 text-center shadow-sm space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
          <Clock size={40} className="text-blue-400" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-black text-restaurante-oscuro">Sin turno activo</p>
        <p className="text-gray-500 font-medium">Inicia tu turno para comenzar a registrar tu actividad.</p>
      </div>
      <LoadingButton
        onClick={handleStartShift}
        isLoading={isPendingStart}
        loadingText="Iniciando..."
        className="bg-restaurante-primario hover:bg-restaurante-oscuro text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-restaurante-primario/25 transition-all hover:-translate-y-1 flex items-center gap-2 mx-auto"
      >
        <Play size={18} /> Iniciar Turno
      </LoadingButton>
    </div>
  )
}
