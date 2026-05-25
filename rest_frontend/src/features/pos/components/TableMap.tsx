"use client"

import { useState, useEffect } from "react"
import { TableDetailModal } from "./TableDetailModal"
import { Receipt, Play, Filter, CheckCircle2, CalendarClock, Plus, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/axios"

import { Product } from "./TableProductMenu"

// Tipos
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
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateTable = async () => {
    setIsCreating(true)
    try {
      const maxNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
      await apiClient.post('/tables/tables/', {
        number: (maxNumber + 1).toString(), // <-- Ahora se envía 'number', corrigiendo el error 400
        capacity: 4,
        status: 'Libre'
      })
      fetchTables()
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTable = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm("¿Estás seguro de que deseas eliminar esta mesa?")) {
      try {
        await apiClient.delete(`/tables/tables/${id}/`)
        fetchTables()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const fetchTables = async () => {
    try {
      const res = await apiClient.get('/tables/tables/')
      // Transform incoming data to make sure numeric values are correct
      const transformed = res.data.map((t: any) => ({
        ...t,
        id: t.id.toString(),
        number: parseInt(t.number) || 0,
      }))
      setTables(transformed)
    } catch (err) {
      console.error("Error fetching tables", err)
    }
  }

  useEffect(() => {
    fetchTables()
    // Optionally we could set an interval to poll
  }, [])

  const handleUpdateTable = (updatedTable: Table) => {
    // When a table is updated, we fetch everything from server to be sure, 
    // or we could optimistically update. Let's optimistically update:
    const transformed = {
      ...updatedTable,
      number: typeof updatedTable.number === "string" ? parseInt(updatedTable.number) || 0 : updatedTable.number
    }
    setTables(prev => prev.map(t => t.id === transformed.id ? transformed : t))
    setSelectedTable(transformed)
    // Refetch in the background to sync
    fetchTables()
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

      {/* Barra de Filtros con Estilo Glassmorphism */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/20 backdrop-blur-md p-5 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex items-center justify-between w-full xl:w-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-restaurante-primario/10 rounded-xl text-restaurante-primario">
              <Filter size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-restaurante-oscuro">Filtrar Mesas</h2>
              <p className="text-xs text-gray-500 font-medium">Visualiza el estado por categorías</p>
            </div>
          </div>

          {/* Botón Crear Mesa (Móvil) */}
          <button
            onClick={handleCreateTable}
            disabled={isCreating}
            className="xl:hidden ml-4 px-4 py-2 bg-restaurante-primario text-white rounded-xl text-sm font-bold flex items-center shadow-lg"
          >
            <Plus size={16} className="mr-1" /> Mesa
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">
          <div className="flex flex-wrap gap-2">
            {(["Todas", "Libre", "Ocupada", "Reservada"] as TableStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border ${activeFilter === status
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

          {/* Botón Crear Mesa (Desktop) */}
          <button
            onClick={handleCreateTable}
            disabled={isCreating}
            className="hidden xl:flex ml-4 px-5 py-2.5 bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-2xl text-sm font-bold items-center transition-all shadow-lg hover:-translate-y-1"
          >
            <Plus size={18} className="mr-2" /> Añadir Mesa
          </button>
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
              {/* Controles superiores derechos */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={(e) => handleDeleteTable(e, table.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar Mesa"
                >
                  <Trash2 size={16} />
                </button>
                <div className={`w-3 h-3 rounded-full animate-pulse ${styles.indicator}`} />
              </div>

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
          )
        })}
      </div>

      {/* Modal de Detalle de Mesa */}
      <TableDetailModal
        table={selectedTable}
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        onUpdateTable={handleUpdateTable}
        onDeleteTable={async (id) => {
          if (confirm("¿Estás seguro de que deseas eliminar esta mesa?")) {
            try {
              await apiClient.delete(`/tables/tables/${id}/`)
              fetchTables()
              setSelectedTable(null)
            } catch (err) {
              console.error(err)
            }
          }
        }}
        onRefetch={fetchTables}
      />
    </div>
  )
}