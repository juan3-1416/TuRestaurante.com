"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/axios"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FiltroTiempo = "general" | "hoy" | "ayer" | "por_año" | "por_mes" | "por_dia"

export interface ReporteSummary {
  ingresosTotales: number
  ticketsGenerados: number
  ticketPromedio: number
  mesasAtendidas: number
  platillosServidos: number
  fugasReportadas: number
}

export interface IngresoData {
  label: string
  ingreso: number
  tickets: number
}

export interface HoraPicoData {
  hora: string
  ordenes: number
}

export interface TopProductoData {
  name: string
  quantity: number
  total_income: number
}

export interface MetodoPagoData {
  method: string
  count: number
  total: number
}

export interface ResumenEmpleadoData {
  name: string
  role: string
  income: number
  tickets: number
  tables: number
}

export interface ReporteData {
  summary: ReporteSummary
  ingresos: IngresoData[]
  horasPico: HoraPicoData[]
  topProductos: TopProductoData[]
  metodosPago: MetodoPagoData[]
  empleados: ResumenEmpleadoData[]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReportes() {
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>("general")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate())

  const { data, isLoading, error } = useQuery<ReporteData>({
    queryKey: ["reportes", filtroTiempo, selectedYear, selectedMonth, selectedDay],
    queryFn: async () => {
      const response = await apiClient.get<ReporteData>("/reports/", {
        params: { 
            period: filtroTiempo,
            year: selectedYear,
            month: selectedMonth,
            day: selectedDay
        },
      })
      return response.data
    },
  })

  // Fallback vacío en caso de que no haya data aún
  const defaultData: ReporteData = {
    summary: { ingresosTotales: 0, ticketsGenerados: 0, ticketPromedio: 0, mesasAtendidas: 0, platillosServidos: 0, fugasReportadas: 0 },
    ingresos: [],
    horasPico: [],
    topProductos: [],
    metodosPago: [],
    empleados: [],
  }

  return {
    filtroTiempo,
    setFiltroTiempo,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedDay,
    setSelectedDay,
    isLoading,
    error,
    ...(data || defaultData),
  }
}
