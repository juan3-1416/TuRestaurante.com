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
  hoy: "Hoy",
  semana: "Esta Semana",
  mes: "Este Mes",
  año: "Este Año",
}

const INCOME_CHART_LABEL: Record<FiltroTiempo, string> = {
  hoy: "Ingresos por Hora",
  semana: "Ingresos por Día",
  mes: "Ingresos por Semana",
  año: "Ingresos por Mes",
}

const FILTROS: FiltroTiempo[] = ["hoy", "semana", "mes", "año"]

export function ReportesDashboard() {
  const {
    filtroTiempo,
    setFiltroTiempo,
    summary,
    ingresos,
    horasPico,
    topProductos,
    metodosPago,
    empleados,
  } = useReportes()

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

        {/* Filtro de Período */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltroTiempo(f)}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                filtroTiempo === f
                  ? "bg-white text-indigo-700 shadow-sm border border-indigo-100"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              {PERIOD_LABELS[f]}
            </button>
          ))}
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

      {/* Nota de datos mock */}
      <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200 p-4 rounded-2xl text-xs text-amber-800 font-medium">
        <RefreshCw size={14} className="shrink-0 text-amber-600" />
        <span>
          <strong>Datos de demostración:</strong> Los gráficos muestran datos simulados mientras el equipo de backend implementa los endpoints de reportes (
          <code className="bg-amber-100 px-1 rounded">/api/reports/</code>).
          La integración real solo requiere cambiar el hook <code className="bg-amber-100 px-1 rounded">useReportes.ts</code>.
        </span>
      </div>

    </div>
  )
}
