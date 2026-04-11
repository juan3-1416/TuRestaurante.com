"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  UtensilsCrossed, 
  LayoutGrid, 
  BarChart3, 
  LogOut, 
  ChevronLeft, 
  Menu
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Definimos nuestras rutas principales
  const menuItems = [
    { name: "Menú y Platillos", icon: UtensilsCrossed, path: "/dashboard" },
    { name: "Mapa de Mesas", icon: LayoutGrid, path: "/pos/mesas" },
    // La ruta de reportes la dejamos visualmente desactivada por ahora (Sprint 4)
    { name: "Reportes IA", icon: BarChart3, path: "#", disabled: true },
  ]

  return (
    <aside 
      className={`relative h-[calc(100vh-2rem)] my-4 ml-4 transition-all duration-300 ease-in-out flex flex-col z-20 ${
        isCollapsed ? "w-20" : "w-64"
      } bg-restaurante-primario/60 backdrop-blur-xl border border-white/20 rounded-3xl text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]`}
    >
      {/* Botón para colapsar/expandir (Efecto cristal tintado) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-restaurante-acento/80 backdrop-blur-md border border-white/20 text-white p-1 rounded-full shadow-lg hover:bg-restaurante-claro transition-colors z-30"
      >
        {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Header del Sidebar */}
      <div className="p-6 flex items-center justify-center border-b border-white/10 h-24">
        {isCollapsed ? (
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-xl shadow-lg">
            N
          </div>
        ) : (
          <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white to-restaurante-claro drop-shadow-sm">
            NextOrder
          </h2>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon

          return item.disabled ? (
            <div key={item.name} className="flex items-center p-3 rounded-xl text-white/40 cursor-not-allowed mb-2">
              <Icon size={22} className={isCollapsed ? "mx-auto" : "mr-3"} />
              {!isCollapsed && <span className="font-medium text-sm">Sprint 4: {item.name}</span>}
            </div>
          ) : (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex items-center p-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? "bg-white/20 shadow-lg border border-white/10 backdrop-blur-md text-white" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon 
                size={22} 
                className={`${isCollapsed ? "mx-auto" : "mr-3"} ${isActive ? "text-white" : "group-hover:scale-110 transition-transform duration-200"}`} 
              />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer del Sidebar (Cerrar Sesión) */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-xl text-red-200 hover:bg-red-500/20 hover:backdrop-blur-sm transition-all duration-200 group border border-transparent hover:border-red-500/30"
        >
          <LogOut size={22} className={`${isCollapsed ? "mx-auto" : "mr-3"} group-hover:text-red-400`} />
          {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  )
}