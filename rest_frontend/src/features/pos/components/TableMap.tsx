"use client"

import { useState } from "react"
import { Users, Filter, CheckCircle2, Receipt, CalendarClock, Play } from "lucide-react"
import { TableStatus } from "@/store/posStore"
import { useTables } from "../hooks/useTables"
import { TableDetailModal } from "./TableDetailModal"
import { TableModal } from "./TableModal"

export function TableMap() {
  // Conectamos a React Query para leer las mesas desde la API
  const { tables, isLoading } = useTables()
  const [activeFilter, setActiveFilter] = useState<TableStatus | "Todas">("Todas")
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  
  const filteredTables = tables.filter(table => 
    activeFilter === "Todas" ? true : table.status === activeFilter
  )

  const selectedTable = tables.find(t => t.id === selectedTableId) || null

  const getStatusStyles = (status: TableStatus) => {
    switch (status) {
      case "Libre":
        return {
          bg: "bg-white/60",
          border: "border-green-400/40",
          accent: "text-green-600",
          indicator: "bg-green-500",
          icon: CheckCircle2
        }
      case "Ocupada":
        return {
          bg: "bg-restaurante-primario/10",
          border: "border-red-400/40",
          accent: "text-red-600",
          indicator: "bg-red-500",
          icon: Receipt
        }
      case "Reservada":
        return {
          bg: "bg-white/40",
          border: "border-yellow-400/40",
          accent: "text-yellow-600",
          indicator: "bg-yellow-500",
          icon: CalendarClock
        }
    }
  }

  if (isLoading) {
    return <div className="text-center p-10 text-gray-500">Cargando mesas...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/20 backdrop-blur-md p-5 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-restaurante-primario/10 rounded-xl text-restaurante-primario">
            <Filter size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-restaurante-oscuro">Filtrar Mesas</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {(["Todas", "Libre", "Ocupada", "Reservada"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                  activeFilter === status
                    ? "bg-restaurante-primario text-white border-transparent shadow-lg shadow-restaurante-primario/20 scale-105"
                    : "bg-white/40 border-white/60 text-restaurante-oscuro hover:bg-white/60"
                }`}
              >
                {status}
                {status !== "Todas" && (
                  <span className="ml-2 opacity-60 text-xs">
                    ({tables.filter(t => t.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-white/40 hidden sm:block"></div>
          <TableModal />
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => {
          const styles = getStatusStyles(table.status)
          const StatusIcon = styles.icon
          
          return (
            <div 
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className={`group relative flex flex-col p-6 rounded-[2.5rem] backdrop-blur-xl border-2 transition-all duration-500 cursor-pointer ${styles.bg} ${styles.border} hover:shadow-2xl hover:-translate-y-2`}
            >
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full animate-pulse ${styles.indicator}`} />

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-white/50 border border-white/80 shadow-sm ${styles.accent}`}>
                    <StatusIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-restaurante-oscuro tracking-tight">
                      Mesa {table.number}
                    </h3>
                    <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <Users size={12} className="mr-1" /> {table.capacity} Personas
                    </div>
                  </div>
                </div>

                <div className="min-h-[60px] flex flex-col justify-center">
                  {table.customerName ? (
                    <div className="bg-white/40 p-3 rounded-2xl border border-white/60 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Cliente / Referencia</p>
                      <p className="text-sm font-bold text-restaurante-oscuro truncate">{table.customerName}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic pl-2">Sin actividad reciente</p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  {table.status === "Ocupada" && (
                    <div className="text-restaurante-primario">
                      <span className="text-[10px] font-bold block uppercase opacity-60">Consumo</span>
                      <span className="text-lg font-black tracking-tighter">Bs. {(table.currentTotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {table.status === "Reservada" && (
                    <div className="text-yellow-700">
                      <span className="text-[10px] font-bold block uppercase opacity-60">Hora</span>
                      <span className="text-lg font-black tracking-tighter">{table.activeTime}</span>
                    </div>
                  )}
                  {table.status === "Libre" && (
                    <div className="text-green-600 font-bold text-sm flex items-center gap-1">
                      <CheckCircle2 size={16} /> Lista para usar
                    </div>
                  )}
                  
                  <div className="p-2 rounded-xl bg-white/50 text-restaurante-primario opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={18} fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          )})}
      </div>

      {/* Al pasar el ID de la mesa como KEY, el modal reinicia por completo sus estados internos al cambiar de mesa sin usar useEffect */}
      <TableDetailModal 
        key={selectedTableId || "none"}
        table={selectedTable} 
        isOpen={!!selectedTableId} 
        onClose={() => {
          setSelectedTableId(null)
          setActiveFilter("Todas") // Resetea el filtro a "Todas" para evitar que la mesa desaparezca de la vista al cambiar de estado
        }}
      />
    </div>
  )
}