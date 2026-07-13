"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { HoraPicoData } from "../hooks/useReportes"

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-gray-100 shadow-xl rounded-2xl p-3 text-sm">
        <p className="font-black text-gray-800 mb-1">{label}</p>
        <p className="text-orange-700 font-bold">{payload[0]?.value} órdenes</p>
      </div>
    )
  }
  return null
}

interface HorasPicoChartProps {
  data: HoraPicoData[]
}

export function HorasPicoChart({ data }: HorasPicoChartProps) {
  const maxValue = Math.max(...data.map(d => d.ordenes))

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Horas Pico</h3>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Órdenes por franja horaria</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="hora" 
            tick={{ fontSize: 11, fontWeight: 700, fill: "#9ca3af" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 11, fontWeight: 600, fill: "#9ca3af" }} 
            axisLine={false} 
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)", radius: 8 }} />
          <Bar dataKey="ordenes" radius={[8, 8, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.ordenes === maxValue ? "#f97316" : "#fed7aa"} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
