"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { IngresoData } from "../hooks/useReportes"

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-gray-100 shadow-xl rounded-2xl p-3 text-sm">
        <p className="font-black text-gray-800 mb-1">{label}</p>
        <p className="text-green-700 font-bold">Bs. {payload[0]?.value?.toLocaleString()}</p>
        {payload[1] && (
          <p className="text-blue-600 font-semibold text-xs">{payload[1].value} tickets</p>
        )}
      </div>
    )
  }
  return null
}

interface IngresosPorTiempoChartProps {
  data: IngresoData[]
  label?: string
}

export function IngresosPorTiempoChart({ data, label = "Ingresos por Período" }: IngresosPorTiempoChartProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-4">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{label}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 11, fontWeight: 700, fill: "#9ca3af" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 11, fontWeight: 600, fill: "#9ca3af" }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(v) => `${v.toLocaleString()}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)", radius: 8 }} />
          <Bar 
            dataKey="ingreso" 
            fill="#6366f1" 
            radius={[8, 8, 0, 0]} 
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
