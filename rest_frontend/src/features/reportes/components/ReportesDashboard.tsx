"use client"

import { BarChart3, TrendingUp, Receipt, Hash, Utensils, AlertTriangle, RefreshCw } from "lucide-react"
import { useReportes, FiltroTiempo } from "../hooks/useReportes"
import { KpiCard } from "./KpiCard"
import { IngresosPorTiempoChart } from "./IngresosPorTiempoChart"
import { HorasPicoChart } from "./HorasPicoChart"
import { TopProductosChart } from "./TopProductosChart"
import { MetodosPagoChart } from "./MetodosPagoChart"
import { ResumenEmpleadosTable } from "./ResumenEmpleadosTable"

const PERIOD_LABELS: Record<FiltroTiempo, string> = {
  general: "Histórico General",
  hoy: "Hoy",
  ayer: "Ayer",
  por_año: "Por Año",
  por_mes: "Por Mes",
  por_dia: "Por Día",
}

const INCOME_CHART_LABEL: Record<FiltroTiempo, string> = {
  general: "Ingresos por Mes",
  hoy: "Ingresos por Hora",
  ayer: "Ingresos por Hora",
  por_año: "Ingresos por Mes",
  por_mes: "Ingresos por Día",
  por_dia: "Ingresos por Hora",
}

const FILTROS: FiltroTiempo[] = ["general", "hoy", "ayer", "por_año", "por_mes", "por_dia"]
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function ReportesDashboard() {
  const {
    filtroTiempo,
    setFiltroTiempo,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedDay,
    setSelectedDay,
    summary,
    ingresos,
    horasPico,
    topProductos,
    metodosPago,
    empleados,
  } = useReportes()
  
  const diasEnMes = new Date(selectedYear, selectedMonth, 0).getDate()

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/60 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl shadow-inner">
              <BarChart3 size={28} />
            </div>
            Reportes
          </h1>
          <p className="text-gray-500 mt-2 font-medium ml-1">
            Análisis de rendimiento del restaurante · <span className="font-bold text-indigo-600">{PERIOD_LABELS[filtroTiempo]}</span>
          </p>
        </div>

        {/* Filtros de Período Dinámicos */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <select
            value={filtroTiempo}
            onChange={(e) => setFiltroTiempo(e.target.value as FiltroTiempo)}
            className="px-4 py-2.5 rounded-xl border border-gray-200/80 bg-white text-gray-700 font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
          >
            {FILTROS.map((f) => (
              <option key={f} value={f}>
                {PERIOD_LABELS[f]}
              </option>
            ))}
          </select>
          
          {filtroTiempo === "por_dia" && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-gray-200/80 bg-white text-gray-700 font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => (
                <option key={dia} value={dia}>
                  Día {dia}
                </option>
              ))}
            </select>
          )}

          {(filtroTiempo === "por_mes" || filtroTiempo === "por_dia") && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-gray-200/80 bg-white text-gray-700 font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {MESES.map((mes, index) => (
                <option key={index + 1} value={index + 1}>
                  {mes}
                </option>
              ))}
            </select>
          )}

          {(filtroTiempo === "por_año" || filtroTiempo === "por_mes" || filtroTiempo === "por_dia") && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-gray-200/80 bg-white text-gray-700 font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Ingresos Totales"
          value={`Bs. ${summary.ingresosTotales.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
          subtitle="Órdenes pagadas"
        />
        <KpiCard
          title="Tickets Generados"
          value={summary.ticketsGenerados}
          icon={Receipt}
          color="indigo"
          subtitle="Órdenes creadas"
        />
        <KpiCard
          title="Mesas Atendidas"
          value={summary.mesasAtendidas}
          icon={Hash}
          color="purple"
          subtitle="Mesas únicas"
        />
        <KpiCard
          title="Platillos Servidos"
          value={summary.platillosServidos}
          icon={Utensils}
          color="orange"
          subtitle="Ítems de órdenes"
        />
        <KpiCard
          title="Fugas Reportadas"
          value={summary.fugasReportadas}
          icon={AlertTriangle}
          color="red"
          subtitle="Órdenes canceladas"
        />
      </div>

      {/* Gráficos — Fila 1: Ingresos + Horas Pico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IngresosPorTiempoChart 
          data={ingresos} 
          label={INCOME_CHART_LABEL[filtroTiempo]}
        />
        <HorasPicoChart data={horasPico} />
      </div>

      {/* Gráficos — Fila 2: Top Platillos + Métodos de Pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductosChart data={topProductos} />
        <MetodosPagoChart data={metodosPago} />
      </div>

      {/* Tabla de Empleados */}
      <ResumenEmpleadosTable data={empleados} />


    </div>
  )
}
