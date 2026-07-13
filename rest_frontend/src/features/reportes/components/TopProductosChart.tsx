"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TopProductoData } from "../hooks/useReportes"

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-gray-100 shadow-xl rounded-2xl p-3 text-sm max-w-[180px]">
        <p className="font-black text-gray-800 mb-2 text-xs leading-tight">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className={`font-bold text-xs ${i === 0 ? "text-indigo-700" : "text-green-700"}`}>
            {p.name === "quantity" ? `${p.value} unidades` : `Bs. ${p.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff", "#4f46e5", "#7c3aed", "#a855f7"]

interface TopProductosChartProps {
  data: TopProductoData[]
}

export function TopProductosChart({ data }: TopProductosChartProps) {
  // Tomamos max 8 productos y les asignamos un truncado para el eje Y
  const chartData = data.slice(0, 8).map(d => ({
    ...d,
    shortName: d.name.length > 16 ? d.name.substring(0, 16) + "…" : d.name,
  }))

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Top Platillos</h3>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Más vendidos por cantidad</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis 
            type="number" 
            tick={{ fontSize: 11, fontWeight: 600, fill: "#9ca3af" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            type="category" 
            dataKey="shortName" 
            tick={{ fontSize: 11, fontWeight: 700, fill: "#4b5563" }} 
            axisLine={false} 
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="quantity" radius={[0, 8, 8, 0]} maxBarSize={26}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
