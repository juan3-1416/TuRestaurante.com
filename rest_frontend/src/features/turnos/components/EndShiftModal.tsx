import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Clock, Loader2, StopCircle } from "lucide-react"

interface EndShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (observations: string) => Promise<void>
  isLoading: boolean
}

export function EndShiftModal({ isOpen, onClose, onConfirm, isLoading }: EndShiftModalProps) {
  const [observations, setObservations] = useState("Sin observaciones")

  const handleConfirm = async () => {
    await onConfirm(observations)
    onClose()
  }

  // Reset observations when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setObservations("Sin observaciones")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-white/40 shadow-2xl rounded-3xl overflow-hidden p-0">
        
        {/* Decoración Superior */}
        <div className="h-32 bg-linear-to-br from-red-500 to-rose-600 relative flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -translate-x-5 translate-y-5"></div>
          <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
            <StopCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="text-center space-y-2 mb-6">
            <DialogTitle className="text-2xl font-black text-restaurante-oscuro tracking-tight">
              Finalizar Turno
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Estás a punto de cerrar tu turno de trabajo actual. ¿Hay algo que desees reportar o dejar como nota?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones del Turno</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ej. Faltaron servilletas, el sistema falló un momento..."
                className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 py-3 bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Cerrando...
                  </>
                ) : (
                  <>
                    <Clock size={18} /> Confirmar Cierre
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
