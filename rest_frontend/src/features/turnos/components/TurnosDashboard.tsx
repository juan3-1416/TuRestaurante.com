"use client"

import { useState, useMemo } from "react"
import { Clock, RefreshCw, Search, Calendar } from "lucide-react"
import { useEmployeeShift, EmployeeShift } from "../hooks/useEmployeeShift"
import { TurnosHistoryTable } from "./TurnosHistoryTable"
import { TurnoDetailModal } from "./TurnoDetailModal"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { useAuthStore } from "@/store/authStore"

export function TurnosDashboard() {
  const { shifts, isLoading, refetch, activeShift, startShift, endShift } = useEmployeeShift()
  const { user } = useAuthStore()
  
  const [searchEmployee, setSearchEmployee] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(null)

  // Filtrado de turnos
  const filteredShifts = useMemo(() => {
    return shifts
      .filter(s => {
        if (!searchEmployee) return true
        const name = (s.full_name || s.username).toLowerCase()
        return name.includes(searchEmployee.toLowerCase())
      })
      .filter(s => {
        if (!filterDate) return true
        const shiftDate = new Date(s.start_time).toISOString().split("T")[0]
        return shiftDate === filterDate
      })
      .filter(s => {
        if (!filterRole) return true
        return s.role === filterRole || s.role === undefined // Si el backend no envía el rol aún, asumimos true para no romper
      })
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
  }, [shifts, searchEmployee, filterDate, filterRole])

  const isAdmin = user?.role === "ADMIN"
  const isWaiter = user?.role === "WAITER"

  // Botón manual para mesero
  const handleToggleWaiterShift = async () => {
    if (activeShift) {
      // Pedimos confirmación y observación al mesero para finalizar
      const obs = window.prompt("¿Observaciones de tu turno (opcional)?", "Sin observaciones")
      if (obs !== null) {
        await endShift.mutateAsync({ observations: obs })
      }
    } else {
      await startShift.mutateAsync()
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/60 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl shadow-inner">
              <Clock size={28} />
            </div>
            Historial de Turnos
          </h1>
          <p className="text-gray-500 mt-2 font-medium ml-1">
            {isAdmin ? "Revisa el historial de turnos de todo el equipo." : "Revisa el registro histórico de tus turnos."}
          </p>
        </div>
        <div className="flex gap-3">
          {isWaiter && (
            <LoadingButton
              onClick={handleToggleWaiterShift}
              isLoading={isLoading}
              className={`px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
                activeShift 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/30 text-white" 
                  : "bg-green-500 hover:bg-green-600 shadow-green-500/30 text-white"
              }`}
            >
              <Clock size={16} />
              {activeShift ? "Finalizar Mi Turno" : "Iniciar Turno"}
            </LoadingButton>
          )}

          <LoadingButton
            onClick={() => refetch()}
            isLoading={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualizar</span>
          </LoadingButton>
        </div>
      </div>

      {/* Filtros (solo si hay turnos o si es admin, para mantener consistencia) */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-5 shadow-sm flex flex-col sm:flex-row gap-4">
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-4 flex-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Buscar por empleado..."
                className="w-full h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-restaurante-oscuro focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            >
              <option value="">Todos los roles</option>
              <option value="CASHIER">Cajeros</option>
              <option value="WAITER">Meseros</option>
            </select>
          </div>
        )}
        <div className="flex items-center gap-2 flex-1 md:flex-none justify-end">
          <Calendar size={16} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full md:w-auto h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-restaurante-oscuro focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center bg-white/40 rounded-[2.5rem] border border-white/60">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TurnosHistoryTable 
          pastShifts={filteredShifts} 
          onRowClick={(shift) => setSelectedShift(shift)}
        />
      )}

      {/* Modal de Detalle */}
      <TurnoDetailModal 
        shift={selectedShift}
        isOpen={!!selectedShift}
        onClose={() => setSelectedShift(null)}
      />

    </div>
  )
}
