import { FileText, Calendar, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { EmployeeShift } from "../hooks/useEmployeeShift"

interface TurnosHistoryTableProps {
  pastShifts: EmployeeShift[]
  onRowClick?: (shift: EmployeeShift) => void
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "—"
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
}

export function TurnosHistoryTable({ pastShifts, onRowClick }: TurnosHistoryTableProps) {
  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 shadow-sm">
      <h3 className="text-xl font-black text-restaurante-oscuro mb-6 flex items-center gap-2">
        <FileText className="text-restaurante-primario" size={22} /> Historial de Turnos
        <span className="text-xs font-bold text-white bg-restaurante-primario px-3 py-1 rounded-full ml-2">
          {pastShifts.length} registros
        </span>
      </h3>

      {pastShifts.length === 0 ? (
        <p className="text-sm text-center text-gray-400 italic py-8 bg-white/50 rounded-3xl border border-dashed border-gray-200">
          Aún no tienes turnos completados en el historial.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">Empleado</th>
                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">Rol</th>
                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">Fecha</th>
                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">Entrada</th>
                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">Salida</th>
                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">Ingresos</th>
                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest pb-3">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pastShifts.map((shift) => (
                <tr 
                  key={shift.id} 
                  className={`transition-colors ${onRowClick ? "hover:bg-blue-50/50 cursor-pointer" : "hover:bg-white/60"}`}
                  onClick={() => onRowClick && onRowClick(shift)}
                >
                  <td className="py-4 pr-4">
                    <span className="font-semibold text-sm text-restaurante-oscuro">{shift.full_name || shift.username}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${
                      (shift.role || "").includes("CASHIER") || (shift.full_name?.toLowerCase().includes("cajero")) 
                        ? "bg-indigo-100 text-indigo-700" 
                        : (shift.role || "").includes("ADMIN") || (shift.full_name?.toLowerCase().includes("admin")) 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {shift.role || (shift.full_name?.toLowerCase().includes("cajero") ? "CASHIER" : (shift.full_name?.toLowerCase().includes("admin") ? "ADMIN" : "WAITER"))}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="font-semibold text-sm text-gray-700">{formatDate(shift.start_time)}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-mono font-bold text-sm text-restaurante-oscuro">{formatTime(shift.start_time)}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-mono font-bold text-sm text-restaurante-oscuro">{formatTime(shift.end_time)}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-green-500" />
                      <span className="font-black text-sm text-green-700">Bs. {shift.generated_income.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    {shift.observations ? (
                      <div className="flex items-start gap-1.5">
                        <AlertCircle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600 font-medium max-w-xs">{shift.observations}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-green-400" />
                        <span className="text-xs text-gray-400 italic">Sin observaciones</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
