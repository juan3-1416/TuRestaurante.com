import { Sidebar } from "./Sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Añadimos un gradiente de fondo sutil usando tu color restaurante-claro
  return (
    <div className="flex h-screen bg-linear-to-br from-gray-50 via-restaurante-claro/10 to-gray-100 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}