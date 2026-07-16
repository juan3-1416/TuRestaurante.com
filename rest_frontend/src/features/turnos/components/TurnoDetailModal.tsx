import React from "react"
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
  const [showDishes, setShowDishes] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) setShowDishes(false)
  }, [isOpen])

  if (!shift) return null

  // Fallback inteligente para el rol
  const roleName = shift.role || (shift.full_name?.toLowerCase().includes("cajero") ? "CASHIER" : (shift.full_name?.toLowerCase().includes("admin") ? "ADMIN" : "WAITER"))

  // Mock de datos solicitados si el backend no los envía todavía
  const loginTime = shift.login_time || shift.start_time
  const logoutTime = shift.logout_time || shift.end_time
  const scheduledStart = shift.scheduled_start || "08:00"
  const scheduledEnd = shift.scheduled_end || "16:00"
  const shiftTitle = shift.shift_title || (new Date(shift.start_time).getHours() > 14 ? "Turno Tarde/Noche" : "Turno Día")
  
  const ticketsGenerated = shift.tickets_generated ?? shift.orders_charged ?? 0
  const walkoutObservations = shift.walkout_observations ?? []
  const tablesServed = shift.tables_served ?? 0
  const soldDishes = shift.sold_dishes ?? []
  
  const totalDishesCount = soldDishes.reduce((acc, dish) => acc + dish.quantity, 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white/95 backdrop-blur-3xl border-white/60 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] rounded-[2.5rem] sm:max-w-[850px] max-h-[95vh] overflow-hidden flex flex-col p-0 transition-all duration-300">
        
        {/* Header Premium */}
        <div className="p-6 px-8 text-left flex justify-between items-center relative border-b bg-linear-to-br from-blue-600 to-indigo-700 shadow-inner">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <DialogTitle className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              {shiftTitle} 
              <span className="text-xs px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-xl uppercase tracking-widest shadow-sm border border-white/30">{roleName}</span>
            </DialogTitle>
            <p className="text-sm text-blue-100 mt-1.5 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
              Empleado: <span className="font-bold text-white tracking-wide">{shift.full_name || shift.username}</span>
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 px-8 overflow-y-auto space-y-6">
          
          {/* Tiempos en Grid Premium */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Calendar size={12}/> Fecha</p>
              <p className="font-black text-gray-800 text-sm">{formatDate(shift.start_time)}</p>
            </div>
            <div className="bg-linear-to-br from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Clock size={12}/> Prog.</p>
              <p className="font-black text-gray-800 text-sm">{scheduledStart} - {scheduledEnd}</p>
            </div>
            <div className="bg-linear-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-100/60 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1"><LogIn size={12}/> Sesión</p>
              <p className="font-black text-blue-900 text-sm">{formatTime(loginTime)} - {formatTime(logoutTime)}</p>
            </div>
            <div className="bg-linear-to-br from-indigo-50 to-purple-50/50 p-4 rounded-2xl border border-indigo-100/60 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-indigo-900"><Clock size={64}/></div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Clock size={12}/> Duración</p>
              <p className="font-black text-indigo-900 text-sm">{calcDuration(loginTime, logoutTime)}</p>
            </div>
          </div>

          {/* KPIs Principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2 bg-linear-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100/60 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-200/50 rounded-lg"><TrendingUp size={16} className="text-green-700" /></div>
                <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Ingresos Totales</p>
              </div>
              <p className="text-2xl font-black text-green-700 tracking-tight">Bs. {shift.generated_income.toFixed(2)}</p>
            </div>

            <div className="flex flex-col gap-2 bg-linear-to-br from-purple-50 to-fuchsia-50 p-4 rounded-2xl border border-purple-100/60 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-200/50 rounded-lg"><Receipt size={16} className="text-purple-700" /></div>
                <p className="text-[10px] font-bold text-purple-800 uppercase tracking-widest">Tickets Gen.</p>
              </div>
              <p className="text-2xl font-black text-purple-700 tracking-tight">{ticketsGenerated}</p>
            </div>

            <div className="flex flex-col gap-2 bg-linear-to-br from-blue-50 to-cyan-50 p-4 rounded-2xl border border-blue-100/60 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-200/50 rounded-lg"><Hash size={16} className="text-blue-700" /></div>
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Mesas Atendidas</p>
              </div>
              <p className="text-2xl font-black text-blue-700 tracking-tight">{tablesServed}</p>
            </div>

            {/* Nuevo KPI interactivo para platillos */}
            <div 
              onClick={() => setShowDishes(!showDishes)}
              className={`flex flex-col gap-2 p-4 rounded-2xl border shadow-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                showDishes 
                  ? "bg-linear-to-br from-orange-500 to-amber-500 border-orange-400 shadow-orange-500/20 text-white" 
                  : "bg-linear-to-br from-orange-50 to-amber-50 border-orange-100/60"
              }`}
            >
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${showDishes ? "bg-white/20" : "bg-orange-200/50"}`}>
                    <Utensils size={16} className={showDishes ? "text-white" : "text-orange-700"} />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${showDishes ? "text-orange-100" : "text-orange-800"}`}>
                    Platillos Vendidos
                  </p>
                </div>
                <div className={`text-xs font-black ${showDishes ? "text-white" : "text-orange-500"}`}>
                  {showDishes ? "Ocultar" : "Ver Lista"}
                </div>
              </div>
              <p className={`text-2xl font-black tracking-tight ${showDishes ? "text-white" : "text-orange-700"}`}>
                {totalDishesCount} <span className="text-sm font-bold opacity-70">unidades</span>
              </p>
            </div>
          </div>

          {/* Lista Colapsable de Platillos */}
          {showDishes && (
            <div className="animate-in slide-in-from-top-4 fade-in duration-300 bg-white border border-gray-200 rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-sm font-black text-restaurante-oscuro flex items-center gap-2">
                  <Utensils size={16} className="text-orange-500" /> Detalle de Platillos Vendidos
                </h4>
                <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  Top Ventas
                </span>
              </div>
              
              {soldDishes.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-medium">No hay platillos registrados en este turno.</div>
              ) : (
                <div className="p-2 overflow-y-auto max-h-[250px] grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50/50">
                  {soldDishes.map((dish, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-2xl hover:border-orange-200 hover:shadow-md transition-all group">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800 truncate pr-2 group-hover:text-orange-600 transition-colors">{dish.name}</span>
                        <span className="text-[10px] font-bold text-gray-400">Bs. {dish.price} c/u</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                        <span className="text-[12px] font-black text-orange-600">x{dish.quantity}</span>
                        <span className="font-black text-sm text-restaurante-oscuro">Bs. {(dish.price * dish.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fugas y Observaciones de Cierre (Grid inferior) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Fugas */}
            <div className="space-y-3 bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-restaurante-oscuro flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded-lg"><AlertTriangle size={14} className="text-red-600" /></div>
                  Fugas / Mesas Observadas
                </h4>
                {(shift.walkouts_count ?? 0) > 0 && (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-red-400 uppercase">Pérdida</span>
                    <span className="text-sm font-black text-red-600">Bs. {shift.walkouts_amount?.toFixed(2)}</span>
                  </div>
                )}
              </div>
              {walkoutObservations.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-2">
                  <CheckCircle2 size={24} className="text-gray-300" />
                  <p className="text-xs text-gray-400 font-medium">
                    Sin observaciones ni fugas. Todo en orden.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50/50 rounded-2xl border border-red-100 overflow-hidden divide-y divide-red-100/50 max-h-40 overflow-y-auto">
                  {walkoutObservations.map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 hover:bg-red-50 transition-colors">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="font-bold text-xs text-red-900 leading-relaxed">{obs}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones de Cierre */}
            <div className="space-y-3 bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm">
              <h4 className="text-sm font-black text-restaurante-oscuro flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg"><Clock size={14} className="text-yellow-600" /></div>
                Cierre de Turno
              </h4>
              {shift.observations ? (
                <div className="bg-linear-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm h-full">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-bold text-yellow-900 leading-relaxed">{shift.observations}</p>
                </div>
              ) : (
                <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm h-full">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <p className="text-xs font-bold text-green-900">Sin observaciones. Cierre estándar.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
