import { Square, X } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"

interface TurnosEndShiftModalProps {
  isOpen: boolean
  onClose: () => void
  observations: string
  setObservations: (obs: string) => void
  isEndingShift: boolean
  handleEndShift: () => void
}

export function TurnosEndShiftModal({
  isOpen,
  onClose,
  observations,
  setObservations,
  isEndingShift,
  handleEndShift
}: TurnosEndShiftModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-restaurante-oscuro">Finalizar Turno</h2>
            <p className="text-sm text-gray-500 mt-1">Agrega una observación opcional antes de cerrar.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observaciones (opcional)</label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            placeholder="Ej: Sin novedades, todo en orden..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-restaurante-oscuro focus:outline-none focus:border-restaurante-primario focus:ring-2 focus:ring-restaurante-primario/20 transition-all resize-none"
          />
        </div>

        <div className="flex gap-3">
          <LoadingButton
            variant="outline"
            className="flex-1 rounded-xl h-11 border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
            onClick={onClose}
            disabled={isEndingShift}
          >
            Cancelar
          </LoadingButton>
          <LoadingButton
            onClick={handleEndShift}
            isLoading={isEndingShift}
            loadingText="Cerrando..."
            className="flex-2 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 font-bold shadow-md shadow-red-500/20"
          >
            <Square className="mr-2" size={16} /> Confirmar Cierre
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
