"use client"

import { useState, useMemo } from "react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FiltroTiempo = "hoy" | "semana" | "mes" | "año"

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
  hours: number
}

// ─── Mock Data por Período ────────────────────────────────────────────────────

const mockData: Record<FiltroTiempo, {
  summary: ReporteSummary
  ingresos: IngresoData[]
  horasPico: HoraPicoData[]
  topProductos: TopProductoData[]
  metodosPago: MetodoPagoData[]
  empleados: ResumenEmpleadoData[]
}> = {
  hoy: {
    summary: {
      ingresosTotales: 2840.50,
      ticketsGenerados: 28,
      ticketPromedio: 101.45,
      mesasAtendidas: 15,
      platillosServidos: 84,
      fugasReportadas: 1,
    },
    ingresos: [
      { label: "10:00", ingreso: 120, tickets: 2 },
      { label: "11:00", ingreso: 310, tickets: 4 },
      { label: "12:00", ingreso: 680, tickets: 8 },
      { label: "13:00", ingreso: 740, tickets: 9 },
      { label: "14:00", ingreso: 350, tickets: 3 },
      { label: "15:00", ingreso: 120, tickets: 1 },
      { label: "18:00", ingreso: 290, tickets: 3 },
      { label: "19:00", ingreso: 380, tickets: 4 },
      { label: "20:00", ingreso: 420, tickets: 5 },
    ],
    horasPico: [
      { hora: "10:00", ordenes: 2 }, { hora: "11:00", ordenes: 4 },
      { hora: "12:00", ordenes: 8 }, { hora: "13:00", ordenes: 9 },
      { hora: "14:00", ordenes: 3 }, { hora: "15:00", ordenes: 1 },
      { hora: "18:00", ordenes: 3 }, { hora: "19:00", ordenes: 4 },
      { hora: "20:00", ordenes: 5 },
    ],
    topProductos: [
      { name: "Milanesa de Pollo", quantity: 12, total_income: 600 },
      { name: "Salteña", quantity: 18, total_income: 270 },
      { name: "Hamburguesa Clásica", quantity: 8, total_income: 480 },
      { name: "Jugo de Naranja", quantity: 14, total_income: 210 },
      { name: "Pizza Margherita", quantity: 6, total_income: 480 },
    ],
    metodosPago: [
      { method: "Efectivo", count: 18, total: 1750 },
      { method: "QR", count: 7, total: 720 },
      { method: "Tarjeta", count: 3, total: 370.50 },
    ],
    empleados: [
      { name: "Carlos Mamani", role: "CASHIER", income: 2840.50, tickets: 28, tables: 15, hours: 6 },
      { name: "Ana Flores", role: "WAITER", income: 1450, tickets: 14, tables: 8, hours: 6 },
      { name: "Pedro Quispe", role: "WAITER", income: 1390.50, tickets: 14, tables: 7, hours: 6 },
    ],
  },
  semana: {
    summary: {
      ingresosTotales: 18750.00,
      ticketsGenerados: 185,
      ticketPromedio: 101.35,
      mesasAtendidas: 98,
      platillosServidos: 552,
      fugasReportadas: 4,
    },
    ingresos: [
      { label: "Lun", ingreso: 2100, tickets: 22 },
      { label: "Mar", ingreso: 1850, tickets: 18 },
      { label: "Mié", ingreso: 2400, tickets: 24 },
      { label: "Jue", ingreso: 2700, tickets: 27 },
      { label: "Vie", ingreso: 3800, tickets: 38 },
      { label: "Sáb", ingreso: 4200, tickets: 42 },
      { label: "Dom", ingreso: 1700, tickets: 14 },
    ],
    horasPico: [
      { hora: "10:00", ordenes: 12 }, { hora: "11:00", ordenes: 20 },
      { hora: "12:00", ordenes: 48 }, { hora: "13:00", ordenes: 56 },
      { hora: "14:00", ordenes: 30 }, { hora: "15:00", ordenes: 12 },
      { hora: "18:00", ordenes: 22 }, { hora: "19:00", ordenes: 30 },
      { hora: "20:00", ordenes: 28 }, { hora: "21:00", ordenes: 15 },
    ],
    topProductos: [
      { name: "Milanesa de Pollo", quantity: 75, total_income: 3750 },
      { name: "Salteña", quantity: 120, total_income: 1800 },
      { name: "Hamburguesa Clásica", quantity: 52, total_income: 3120 },
      { name: "Jugo de Naranja", quantity: 95, total_income: 1425 },
      { name: "Pizza Margherita", quantity: 38, total_income: 3040 },
      { name: "Sopa del Día", quantity: 44, total_income: 880 },
      { name: "Arroz con Pollo", quantity: 31, total_income: 1240 },
      { name: "Papas Fritas", quantity: 88, total_income: 1320 },
    ],
    metodosPago: [
      { method: "Efectivo", count: 112, total: 11500 },
      { method: "QR", count: 52, total: 5100 },
      { method: "Tarjeta", count: 21, total: 2150 },
    ],
    empleados: [
      { name: "Carlos Mamani", role: "CASHIER", income: 18750, tickets: 185, tables: 98, hours: 42 },
      { name: "Ana Flores", role: "WAITER", income: 9200, tickets: 92, tables: 49, hours: 40 },
      { name: "Pedro Quispe", role: "WAITER", income: 9550, tickets: 93, tables: 49, hours: 38 },
    ],
  },
  mes: {
    summary: {
      ingresosTotales: 72400.00,
      ticketsGenerados: 720,
      ticketPromedio: 100.55,
      mesasAtendidas: 385,
      platillosServidos: 2160,
      fugasReportadas: 14,
    },
    ingresos: [
      { label: "Sem 1", ingreso: 15800, tickets: 158 },
      { label: "Sem 2", ingreso: 18200, tickets: 183 },
      { label: "Sem 3", ingreso: 20100, tickets: 199 },
      { label: "Sem 4", ingreso: 18300, tickets: 180 },
    ],
    horasPico: [
      { hora: "10:00", ordenes: 45 }, { hora: "11:00", ordenes: 72 },
      { hora: "12:00", ordenes: 185 }, { hora: "13:00", ordenes: 210 },
      { hora: "14:00", ordenes: 115 }, { hora: "15:00", ordenes: 45 },
      { hora: "18:00", ordenes: 88 }, { hora: "19:00", ordenes: 120 },
      { hora: "20:00", ordenes: 105 }, { hora: "21:00", ordenes: 60 },
    ],
    topProductos: [
      { name: "Milanesa de Pollo", quantity: 290, total_income: 14500 },
      { name: "Salteña", quantity: 480, total_income: 7200 },
      { name: "Hamburguesa Clásica", quantity: 210, total_income: 12600 },
      { name: "Jugo de Naranja", quantity: 380, total_income: 5700 },
      { name: "Pizza Margherita", quantity: 155, total_income: 12400 },
      { name: "Sopa del Día", quantity: 175, total_income: 3500 },
      { name: "Arroz con Pollo", quantity: 125, total_income: 5000 },
      { name: "Papas Fritas", quantity: 340, total_income: 5100 },
    ],
    metodosPago: [
      { method: "Efectivo", count: 432, total: 43500 },
      { method: "QR", count: 203, total: 19800 },
      { method: "Tarjeta", count: 85, total: 9100 },
    ],
    empleados: [
      { name: "Carlos Mamani", role: "CASHIER", income: 72400, tickets: 720, tables: 385, hours: 168 },
      { name: "Ana Flores", role: "WAITER", income: 36100, tickets: 360, tables: 192, hours: 160 },
      { name: "Pedro Quispe", role: "WAITER", income: 36300, tickets: 360, tables: 193, hours: 155 },
    ],
  },
  año: {
    summary: {
      ingresosTotales: 840500.00,
      ticketsGenerados: 8240,
      ticketPromedio: 102.00,
      mesasAtendidas: 4420,
      platillosServidos: 24700,
      fugasReportadas: 152,
    },
    ingresos: [
      { label: "Ene", ingreso: 58000, tickets: 575 },
      { label: "Feb", ingreso: 62000, tickets: 610 },
      { label: "Mar", ingreso: 75000, tickets: 735 },
      { label: "Abr", ingreso: 68000, tickets: 670 },
      { label: "May", ingreso: 80000, tickets: 785 },
      { label: "Jun", ingreso: 72000, tickets: 705 },
      { label: "Jul", ingreso: 85000, tickets: 834 },
      { label: "Ago", ingreso: 78000, tickets: 765 },
      { label: "Sep", ingreso: 70000, tickets: 685 },
      { label: "Oct", ingreso: 74000, tickets: 725 },
      { label: "Nov", ingreso: 82000, tickets: 805 },
      { label: "Dic", ingreso: 96500, tickets: 946 },
    ],
    horasPico: [
      { hora: "10:00", ordenes: 480 }, { hora: "11:00", ordenes: 820 },
      { hora: "12:00", ordenes: 2100 }, { hora: "13:00", ordenes: 2480 },
      { hora: "14:00", ordenes: 1380 }, { hora: "15:00", ordenes: 520 },
      { hora: "18:00", ordenes: 1050 }, { hora: "19:00", ordenes: 1420 },
      { hora: "20:00", ordenes: 1250 }, { hora: "21:00", ordenes: 720 },
    ],
    topProductos: [
      { name: "Milanesa de Pollo", quantity: 3400, total_income: 170000 },
      { name: "Salteña", quantity: 5600, total_income: 84000 },
      { name: "Hamburguesa Clásica", quantity: 2450, total_income: 147000 },
      { name: "Jugo de Naranja", quantity: 4400, total_income: 66000 },
      { name: "Pizza Margherita", quantity: 1800, total_income: 144000 },
      { name: "Sopa del Día", quantity: 2050, total_income: 41000 },
      { name: "Arroz con Pollo", quantity: 1450, total_income: 58000 },
      { name: "Papas Fritas", quantity: 3950, total_income: 59250 },
    ],
    metodosPago: [
      { method: "Efectivo", count: 4940, total: 502500 },
      { method: "QR", count: 2350, total: 229800 },
      { method: "Tarjeta", count: 950, total: 108200 },
    ],
    empleados: [
      { name: "Carlos Mamani", role: "CASHIER", income: 840500, tickets: 8240, tables: 4420, hours: 1980 },
      { name: "Ana Flores", role: "WAITER", income: 420250, tickets: 4120, tables: 2210, hours: 1920 },
      { name: "Pedro Quispe", role: "WAITER", income: 420250, tickets: 4120, tables: 2210, hours: 1850 },
    ],
  },
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReportes() {
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>("semana")

  const data = useMemo(() => mockData[filtroTiempo], [filtroTiempo])

  return {
    filtroTiempo,
    setFiltroTiempo,
    isLoading: false,
    ...data,
  }
}
