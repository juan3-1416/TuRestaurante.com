import { MenuManager } from "@/features/menu/components/MenuManager"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Cabecera del Dashboard */}
      {/* <div>
        <h1 className="text-3xl font-bold text-restaurante-oscuro drop-shadow-sm">Gestión del Menú</h1>
        <p className="text-gray-600 mt-1 font-medium">Crea y administra las categorías y platillos del restaurante.</p>
      </div> */}
      <MenuManager />
    </div>
  )
}