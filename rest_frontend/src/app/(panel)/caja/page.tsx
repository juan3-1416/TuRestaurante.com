import { CajaDashboard } from "@/features/caja/components/CajaDashboard"

export default function CajaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-restaurante-oscuro drop-shadow-sm">Control de Caja</h1>
        <p className="text-gray-600 mt-1 font-medium">Gestiona aperturas, cierres y movimientos de dinero del turno actual.</p>
      </div>
      
      {/* Contenedor principal de la caja */}
      <CajaDashboard />
    </div>
  )
}