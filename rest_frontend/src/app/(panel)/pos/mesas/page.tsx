import { TableMap } from "@/features/pos/components/TableMap"

export default function MesasPage() {
  return (
    <div className="space-y-6">
      {/* Cabecera de la página */}
      <div>
        <h1 className="text-3xl font-bold text-restaurante-oscuro drop-shadow-sm">Mapa de Mesas</h1>
        <p className="text-gray-600 mt-1 font-medium">Visualiza el estado del restaurante en tiempo real y gestiona los pedidos.</p>
      </div>
      
      {/* Renderizamos el componente modular */}
      <TableMap />
    </div>
  )
}