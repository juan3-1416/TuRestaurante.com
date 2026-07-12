"use client"

import { BarChart3, TrendingUp, BrainCircuit, Receipt, RefreshCw, Clock } from "lucide-react"
import { useReportes } from "../hooks/useReportes"
import { LoadingButton } from "@/shared/components/LoadingButton"

export function ReportesDashboard() {
  const { 
    filtroTiempo, setFiltroTiempo, isLoading, metricas, 
    handleGenerarNuevoAnalisis 
  } = useReportes()

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-restaurante-primario">
          <BrainCircuit className="animate-spin" size={48} />
          <p className="font-bold tracking-widest text-sm uppercase text-gray-500">Recopilando datos de la IA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      
      {/* 1. Encabezado y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/60 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-3">
            <div className="p-3 bg-restaurante-primario/10 text-restaurante-primario rounded-2xl shadow-inner">
              <BarChart3 size={28} />
            </div>
            Reportes Inteligentes
          </h1>
          <p className="text-gray-500 mt-2 font-medium ml-1">
            Análisis de rendimiento y sugerencias basadas en IA.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:w-auto">
            {["hoy", "semana", "mes"].map((filtro) => (
              <button
                key={filtro}
                onClick={() => setFiltroTiempo(filtro)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                  filtroTiempo === filtro 
                    ? "bg-white text-restaurante-oscuro shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                {filtro}
              </button>
            ))}
          </div>

          <LoadingButton
            onClick={handleGenerarNuevoAnalisis}
            isLoading={isLoading}
            className="w-full sm:w-auto bg-restaurante-oscuro hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            Actualizar Datos
          </LoadingButton>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Ingresos</span>
            <div className="p-2 bg-green-100 text-green-600 rounded-xl"><TrendingUp size={20} /></div>
          </div>
          <span className="text-4xl font-black text-restaurante-oscuro tracking-tighter">Bs. {metricas.ingresosTotales}</span>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pedidos</span>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Receipt size={20} /></div>
          </div>
          <span className="text-4xl font-black text-restaurante-oscuro tracking-tighter">{metricas.pedidosCompletados}</span>
        </div>
        
        <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Ticket Promedio</span>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><BarChart3 size={20} /></div>
          </div>
          <span className="text-4xl font-black text-restaurante-oscuro tracking-tighter">Bs. {metricas.ticketPromedio}</span>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Tiempo Promedio</span>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><Clock size={20} /></div>
          </div>
          <span className="text-4xl font-black text-restaurante-oscuro tracking-tighter">{metricas.tiempoPromedioAtencion}</span>
        </div>
      </div>

    </div>
  )
}
