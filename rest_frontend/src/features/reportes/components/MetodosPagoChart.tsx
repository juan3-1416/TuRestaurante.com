"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { MetodoPagoData } from "../hooks/useReportes"

const COLORS: Record<string, string> = {
  "Efectivo": "#10b981",
  "QR": "#6366f1",
  "Tarjeta": "#f97316",
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { name: string; value: number; payload: MetodoPagoData }[]
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    return (
      <div className="bg-white/95 border border-gray-100 shadow-xl rounded-2xl p-3 text-sm">
        <p className="font-black text-gray-800 mb-1">{item.method}</p>
        <p className="text-gray-600 font-bold">{item.count} transacciones</p>
        <p className="text-green-700 font-bold">Bs. {item.total.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

interface MetodosPagoChartProps {
  data: MetodoPagoData[]
}

export function MetodosPagoChart({ data }: MetodosPagoChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0)

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Métodos de Pago</h3>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Distribución de transacciones</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              dataKey="count"
              nameKey="method"
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.method] || "#94a3b8"} 
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Leyenda personalizada */}
        <div className="flex flex-col gap-3 flex-1">
          {data.map((item) => {
            const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
            const color = COLORS[item.method] || "#94a3b8"
            return (
              <div key={item.method} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{item.method}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-0.5">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
                <span className="text-xs font-black text-gray-500 shrink-0">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
