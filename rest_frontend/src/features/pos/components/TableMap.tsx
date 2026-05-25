"use client"

import { useState, useEffect, useCallback } from "react"
import { TableDetailModal } from "./TableDetailModal"
import { Receipt, Play, Filter, CheckCircle2, CalendarClock, Edit2, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/axios"
import { TableModal } from "./TableModal"

import { Product } from "./TableProductMenu"

// Tipos y Datos Simulados
export type TableStatus = "Libre" | "Ocupada" | "Reservada" | "Todas"

export interface Table {
  id: string
  number: number
  capacity: number
  status: Exclude<TableStatus, "Todas">
  currentTotal?: number
  activeTime?: string
  customerName?: string // Para reservadas u ocupadas
  orders?: Product[]
}

export function TableMap() {
  const [activeFilter, setActiveFilter] = useState<TableStatus>("Todas")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [tables, setTables] = useState<Table[]>([])

  const fetchTables = useCallback(async () => {
    try {
      const res = await apiClient.get('/tables/tables/')
      // Transform incoming data to make sure numeric values are correct
      const transformed = res.data.map((t: Record<string, unknown>) => ({
        ...t,
        id: String(t.id),
        number: parseInt(String(t.number)) || 0,
      })) as Table[]
      setTables(transformed)
    } catch (err) {
      console.error("Error fetching tables", err)
    }
  }, [])

  useEffect(() => {
    const initFetch = async () => {
      await fetchTables()
    }
    initFetch()
    // Optionally we could set an interval to poll
  }, [fetchTables])

  const handleUpdateTable = (updatedTable: Table) => {
    // When a table is updated, we fetch everything from server to be sure, 
    // or we could optimistically update. Let's optimistically update:
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t))
    setSelectedTable(updatedTable)
    // Refetch in the background to sync
    fetchTables()
  }

  const handleDeleteTable = async (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation() // Para evitar que se abra el modal de detalle
    if (window.confirm("¿Estás seguro de que deseas eliminar esta mesa?")) {
      try {
        await apiClient.delete(`/tables/tables/${tableId}/`)
        fetchTables()
      } catch (error) {
        console.error("Error al eliminar la mesa", error)
        alert("Hubo un problema al intentar eliminar la mesa.")
      }
    }
  }
  
  // Filtrado lógico de las mesas
  const filteredTables = tables.filter(table => 
    activeFilter === "Todas" ? true : table.status === activeFilter
  )

  const getStatusStyles = (status: Exclude<TableStatus, "Todas">) => {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Controles: Filtros y Agregar Mesa */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/30 rounded-2xl border border-white/40 text-restaurante-oscuro text-sm font-semibold shadow-sm">
            <Filter size={16} className="text-restaurante-primario" />
            Filtros:
          </div>
          {(["Todas", "Libre", "Ocupada", "Reservada"] as TableStatus[]).map((status) => (
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
        
        <div>
          <TableModal onTableCreated={fetchTables} />
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
              onClick={() => setSelectedTable(table)}
              className={`group relative flex flex-col p-6 rounded-[2.5rem] backdrop-blur-xl border-2 transition-all duration-500 cursor-pointer ${styles.bg} ${styles.border} hover:shadow-2xl hover:-translate-y-2`}
            >
              {/* Acciones Rápidas (Editar/Eliminar) */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <TableModal 
                  tableToEdit={{ id: table.id, number: table.number, capacity: table.capacity }}
                  onTableCreated={fetchTables}
                  trigger={
                    <button 
                      onClick={(e) => e.stopPropagation()} 
                      className="p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-restaurante-primario rounded-full shadow-sm transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  }
                />
                <button 
                  onClick={(e) => handleDeleteTable(e, table.id)}
                  className="p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 rounded-full shadow-sm transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Indicador de Estado Flotante */}
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full animate-pulse ${styles.indicator} group-hover:opacity-0 transition-opacity`} />

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
                      {table.capacity} Personas
                    </div>
                  </div>
                </div>

                {/* Información de la ocupación/reserva */}
                <div className="min-h-[60px] flex flex-col justify-center">
                  {table.customerName ? (
                    <div className="bg-white/40 p-3 rounded-2xl border border-white/60 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Cliente / Referencia</p>
                      <p className="text-sm font-bold text-restaurante-oscuro truncate">{table.customerName}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic pl-2">Sin Reservar</p>
                  )}
                </div>

                {/* Footer de la tarjeta con datos rápidos */}
                <div className="flex justify-between items-center pt-2">
                  {table.status === "Ocupada" && (
                    <div className="text-restaurante-primario">
                      <span className="text-[10px] font-bold block uppercase opacity-60">Consumo</span>
                      <span className="text-lg font-black tracking-tighter">Bs. {table.currentTotal?.toFixed(2)}</span>
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
                      <CheckCircle2 size={16} /> Disponible
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

      {/* Modal de Detalle de Mesa */}
      <TableDetailModal
        table={selectedTable} 
        isOpen={!!selectedTable} 
        onClose={() => setSelectedTable(null)} 
        onUpdateTable={handleUpdateTable}
        onDeleteTable={(id) => {
          if (window.confirm("¿Estás seguro de que deseas eliminar esta mesa?")) {
            apiClient.delete(`/tables/tables/${id}/`).then(() => {
              fetchTables()
              setSelectedTable(null)
            }).catch(e => console.error("Error al eliminar la mesa", e))
          }
        }}
        onRefetch={fetchTables}
      />
    </div>
  )
}