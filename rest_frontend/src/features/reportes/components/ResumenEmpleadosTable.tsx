"use client"

import { ResumenEmpleadoData } from "../hooks/useReportes"
import { TrendingUp, Receipt, Hash, Clock } from "lucide-react"

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  CASHIER: { label: "Cajero", color: "bg-blue-100 text-blue-700" },
  WAITER: { label: "Mesero", color: "bg-green-100 text-green-700" },
  ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-700" },
}

interface ResumenEmpleadosTableProps {
  data: ResumenEmpleadoData[]
}

export function ResumenEmpleadosTable({ data }: ResumenEmpleadosTableProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Rendimiento de Meseros</h3>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Ventas y mesas atendidas en el período</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <th className="text-left p-3 px-4">Empleado</th>
              <th className="text-right p-3 px-4">
                <span className="flex items-center justify-end gap-1"><TrendingUp size={11}/>Ingresos</span>
              </th>
              <th className="text-right p-3 px-4">
                <span className="flex items-center justify-end gap-1"><Receipt size={11}/>Tickets</span>
              </th>
              <th className="text-right p-3 px-4">
                <span className="flex items-center justify-end gap-1"><Hash size={11}/>Mesas</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((emp, i) => {
              const roleInfo = ROLE_LABELS[emp.role] ?? { label: emp.role, color: "bg-gray-100 text-gray-600" }
              return (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                        {emp.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-xs">{emp.name}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 px-4 text-right font-black text-green-700 text-sm">
                    Bs. {emp.income.toLocaleString()}
                  </td>
                  <td className="p-3 px-4 text-right font-bold text-gray-700">{emp.tickets}</td>
                  <td className="p-3 px-4 text-right font-bold text-gray-700">{emp.tables}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
