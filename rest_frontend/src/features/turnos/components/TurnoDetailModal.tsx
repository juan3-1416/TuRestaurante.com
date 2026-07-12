import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { EmployeeShift } from "../hooks/useEmployeeShift"
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle2, Utensils, Hash, LogIn, Receipt, AlertTriangle } from "lucide-react"

interface TurnoDetailModalProps {
  shift: EmployeeShift | null
  isOpen: boolean
  onClose: () => void
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "—"
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
}

function calcDuration(start: string, end: string | null): string {
  if (!end) return "En curso"
  const diffMs = new Date(end).getTime() - new Date(start).getTime()
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

export function TurnoDetailModal({ shift, isOpen, onClose }: TurnoDetailModalProps) {
  if (!shift) return null

  // Fallback inteligente para el rol (usando nombre si no hay role exacto del backend)
  const roleName = shift.role || (shift.full_name?.toLowerCase().includes("cajero") ? "CASHIER" : (shift.full_name?.toLowerCase().includes("admin") ? "ADMIN" : "WAITER"))

  // Mock de datos solicitados si el backend no los envía todavía
  const loginTime = shift.login_time || shift.start_time
  const logoutTime = shift.logout_time || shift.end_time
  const scheduledStart = shift.scheduled_start || "08:00"
  const scheduledEnd = shift.scheduled_end || "16:00"
  const shiftTitle = shift.shift_title || (new Date(shift.start_time).getHours() > 14 ? "Turno Tarde/Noche" : "Turno Día")
  const ordersCharged = shift.orders_charged ?? 0
  const walkoutObservations = shift.walkout_observations ?? []

  const tablesServed = shift.tables_served ?? 0
  const soldDishes = shift.sold_dishes ?? []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white/95 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[2rem] sm:max-w-[700px] max-h-[95vh] overflow-hidden flex flex-col p-0">
        
        {/* Header Compacto */}
        <div className="p-4 px-6 text-left flex justify-between items-center relative border-b bg-linear-to-br from-blue-500/10 to-indigo-600/5 border-blue-500/10">
          <div>
            <DialogTitle className="text-xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-2">
              {shiftTitle} 
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg uppercase tracking-widest">{roleName}</span>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Empleado: <span className="font-bold text-restaurante-oscuro">{shift.full_name || shift.username}</span>
            </p>
          </div>
        </div>

        {/* Contenido (sin mucho scroll) */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Tiempos en Grid Compacto */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10}/> Fecha</p>
              <p className="font-bold text-restaurante-oscuro text-xs mt-0.5">{formatDate(shift.start_time)}</p>
            </div>
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> Prog.</p>
              <p className="font-bold text-restaurante-oscuro text-xs mt-0.5">{scheduledStart}-{scheduledEnd}</p>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1"><LogIn size={10}/> Sesión</p>
              <p className="font-bold text-blue-800 text-xs mt-0.5">{formatTime(loginTime)} - {formatTime(logoutTime)}</p>
            </div>
            <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> Duración</p>
              <p className="font-black text-indigo-700 text-xs mt-0.5">{calcDuration(loginTime, logoutTime)}</p>
            </div>
          </div>

          {/* KPIs Principales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1 bg-green-50/50 p-3 rounded-xl border border-green-100">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-green-600" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ingresos Totales</p>
              </div>
              <p className="text-xl font-black text-green-700">Bs. {shift.generated_income.toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-1 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-purple-600" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Órdenes Cobradas</p>
              </div>
              <p className="text-xl font-black text-purple-700">{ordersCharged || tablesServed}</p>
            </div>
            <div className="flex flex-col gap-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-blue-600" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mesas Atendidas</p>
              </div>
              <p className="text-xl font-black text-blue-700">{tablesServed}</p>
            </div>
          </div>

          {/* Listas (Platillos y Fugas) en 2 Columnas si ambas existen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Platillos */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-restaurante-oscuro flex items-center gap-1.5">
                <Utensils size={14} className="text-orange-500" /> Platillos Vendidos
              </h4>
              {soldDishes.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                  Sin platillos registrados.
                </p>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 max-h-36 overflow-y-auto">
                  {soldDishes.map((dish, index) => (
                    <div key={index} className="flex justify-between items-center p-2 px-3 hover:bg-gray-100/50 transition-colors">
                      <span className="font-semibold text-xs text-restaurante-oscuro truncate pr-2">{dish.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-gray-400">x{dish.quantity}</span>
                        <span className="font-mono font-bold text-[11px] text-green-600">Bs.{(dish.price * dish.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fugas */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-restaurante-oscuro flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-500" /> Observaciones en Mesas
              </h4>
              {walkoutObservations.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                  Sin observaciones ni fugas registradas.
                </p>
              ) : (
                <div className="bg-red-50/30 rounded-xl border border-red-100 overflow-hidden divide-y divide-red-100 max-h-36 overflow-y-auto">
                  {walkoutObservations.map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 px-3">
                      <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="font-semibold text-[11px] text-red-800 leading-tight">{obs}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Observaciones de Cierre */}
          <div className="pt-1">
            <h4 className="text-xs font-black text-restaurante-oscuro mb-2">Cierre de Turno</h4>
            {shift.observations ? (
              <div className="bg-yellow-50/50 border border-yellow-100 p-3 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-yellow-800 leading-relaxed">{shift.observations}</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <p className="text-xs italic text-gray-500">Sin observaciones de cierre.</p>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
