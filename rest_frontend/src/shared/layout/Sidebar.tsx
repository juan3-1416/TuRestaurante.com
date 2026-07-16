"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  UtensilsCrossed, LayoutGrid, BarChart3, LogOut, ChevronLeft, Wallet, Users, UserCircle, LucideIcon, Clock
} from "lucide-react"
import { useAuthStore, Role } from "@/store/authStore"
import { useEmployeeShift } from "@/features/turnos/hooks/useEmployeeShift"
import { EndShiftModal } from "@/features/turnos/components/EndShiftModal"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const { activeShift, endShift } = useEmployeeShift()
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }
  
  const handleEndShiftConfirm = async (observations: string) => {
    await endShift.mutateAsync({ observations })
  }
  
  const menuItems: { name: string; icon: LucideIcon; path: string; disabled?: boolean; roles: Role[] }[] = [
    { name: "Menú y Platillos", icon: UtensilsCrossed, path: "/dashboard", roles: ["ADMIN"] },
    { name: "Mapa de Mesas", icon: LayoutGrid, path: "/pos/mesas", roles: ["ADMIN", "CASHIER", "WAITER"] },
    { name: "Caja", icon: Wallet, path: "/caja", roles: ["ADMIN", "CASHIER"] },
    { name: "Usuarios", icon: Users, path: "/admin/usuarios", roles: ["ADMIN"] }, 
    { name: "Mis Turnos", icon: Clock, path: "/turnos", roles: ["ADMIN", "CASHIER", "WAITER"] },
    { name: "Reportes", icon: BarChart3, path: "/reportes", roles: ["ADMIN"] },
    { name: "Mi Perfil", icon: UserCircle, path: "/perfil", roles: ["ADMIN", "CASHIER", "WAITER"] }, 
  ]

  // Usamos useEffect para evitar errores de hidratación (SSR vs Client)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Filtramos el menú según el rol del usuario conectado
  // Convertimos todo a minúsculas para evitar problemas de capitalización
  const filteredMenu = menuItems.filter(item => 
    user?.role && item.roles.map(r => r.toLowerCase()).includes(user.role.toLowerCase())
  )

  // Determinar color de fondo según el rol para diferenciarlos visualmente
  const getRoleColors = () => {
    if (!user?.role) return "bg-restaurante-oscuro/95 border-white/10 shadow-2xl"
    
    switch (user.role.toUpperCase()) {
      case "CASHIER":
        return "bg-emerald-950/95 border-emerald-500/20 shadow-emerald-900/40 shadow-2xl"
      case "WAITER":
        return "bg-amber-950/95 border-amber-500/20 shadow-amber-900/40 shadow-2xl"
      case "ADMIN":
      default:
        return "bg-restaurante-oscuro/95 border-white/10 shadow-2xl"
    }
  }

  if (!mounted) return null // Evita mostrar la versión SSR sin datos locales

  return (
    <aside 
      className={`relative h-[calc(100vh-2rem)] my-4 ml-4 transition-all duration-300 ease-in-out flex flex-col backdrop-blur-xl rounded-[2.5rem] ${getRoleColors()} ${
        isCollapsed ? "w-[88px]" : "w-[280px]"
      }`}
    >
      {/* Botón para colapsar/expandir */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-10 bg-restaurante-primario text-white p-2 rounded-full shadow-lg hover:bg-restaurante-acento transition-colors z-10 hidden md:block border-4 border-gray-50"
      >
        <ChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Header del Sidebar (Logo y Perfil) */}
      <div className="p-6 flex flex-col gap-6">
        <div className={`flex items-center text-white ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-restaurante-primario to-restaurante-acento flex items-center justify-center shadow-lg shadow-restaurante-primario/30 shrink-0">
            <span className="font-black text-xl tracking-tight leading-none">N</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-300">
              <span className="font-black text-xl tracking-tight leading-none">NextOrder</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">
                {user?.role || "Sistema POS"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navegación - Mapeamos filteredMenu en lugar de menuItems */}
      <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
        {filteredMenu.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path
          
          if (item.disabled) return (
            <div key={item.name} className="flex items-center p-3 rounded-xl text-white/20 cursor-not-allowed opacity-50">
              <Icon size={22} className={`${isCollapsed ? "mx-auto" : "mr-3"}`} />
              {!isCollapsed && <span className="font-medium text-sm">Sprint 5: {item.name}</span>}
            </div>
          )

          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex items-center p-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? "bg-white/20 shadow-lg border border-white/10 backdrop-blur-md text-white" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}>
              <Icon 
                size={22} 
                className={`${isCollapsed ? "mx-auto" : "mr-3"} ${isActive ? "text-white" : "group-hover:scale-110 transition-transform duration-200"}`} 
              />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer del Sidebar (Acciones) */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Botón de Finalizar Turno (Solo para roles con turno activo y que no sean ADMIN) */}
        {activeShift && user?.role !== "ADMIN" && (
          <button 
            onClick={() => setIsEndShiftModalOpen(true)}
            className="flex items-center w-full p-3 rounded-xl text-orange-200 hover:bg-orange-500/20 hover:backdrop-blur-sm transition-all duration-200 group border border-transparent hover:border-orange-500/30"
          >
            <Clock size={22} className={`${isCollapsed ? "mx-auto" : "mr-3"} group-hover:scale-110 transition-transform duration-200`} />
            {!isCollapsed && <span className="font-bold">Finalizar Turno</span>}
          </button>
        )}
        
        {/* Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-xl text-red-200 hover:bg-red-500/20 hover:backdrop-blur-sm transition-all duration-200 group border border-transparent hover:border-red-500/30"
        >
          <LogOut size={22} className={`${isCollapsed ? "mx-auto" : "mr-3"} group-hover:-translate-x-1 transition-transform duration-200`} />
          {!isCollapsed && <span className="font-bold">Cerrar Sesión</span>}
        </button>
      </div>

      <EndShiftModal 
        isOpen={isEndShiftModalOpen}
        onClose={() => setIsEndShiftModalOpen(false)}
        onConfirm={handleEndShiftConfirm}
        isLoading={endShift.isPending}
      />
    </aside>
  )
}