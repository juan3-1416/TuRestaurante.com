import { Receipt, AlertTriangle, Eye } from "lucide-react"
import { Table } from "@/store/posStore"

interface CajaPendingTablesProps {
  isShiftOpen: boolean;
  pendingTables: Table[];
  observedTables: Table[];
  handleOpenPaymentModal: (table: Table) => void;
  handleOpenWalkoutModal: (table: Table) => void;
}

export function CajaPendingTables({ isShiftOpen, pendingTables, observedTables, handleOpenPaymentModal, handleOpenWalkoutModal }: CajaPendingTablesProps) {
  if (!isShiftOpen) return null;

  return (
    <div className="space-y-6">
      {/* Mesas Normales Pendientes de Cobro */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-restaurante-oscuro flex items-center gap-2 mb-4 px-2">
          <Receipt className="text-restaurante-primario" size={20} /> Pendientes de Cobro
          <span className="text-xs font-bold text-white bg-restaurante-primario px-3 py-1 rounded-full shadow-sm ml-2">
            {pendingTables.length} mesas
          </span>
        </h3>
        {pendingTables.length === 0 ? (
          <p className="text-sm text-center text-gray-500 italic py-6 bg-white/50 rounded-3xl border border-dashed border-gray-200">
            No hay cuentas pendientes por cobrar en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pendingTables.map((table) => (
              <div key={table.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                <div>
                  <h4 className="font-black text-xl text-restaurante-oscuro">Mesa {table.number}</h4>
                  <p className="text-sm font-bold text-restaurante-primario">Bs. {table.currentTotal?.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => handleOpenPaymentModal(table)}
                  className="bg-restaurante-primario/10 text-restaurante-primario hover:bg-restaurante-primario hover:text-white p-3 rounded-2xl transition-colors">
                  <Receipt size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mesas Observadas (Fugas) */}
      {observedTables.length > 0 && (
        <div className="bg-orange-50/60 backdrop-blur-xl border border-orange-200/60 rounded-[2.5rem] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-4 px-2">
            <AlertTriangle className="text-orange-500" size={20} /> Mesas Observadas — Fuga
            <span className="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full shadow-sm ml-2">
              {observedTables.length} mesa(s)
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {observedTables.map((table) => (
              <div key={table.id} className="bg-white p-5 rounded-3xl border border-orange-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-xl text-restaurante-oscuro">Mesa {table.number}</h4>
                    <p className="text-sm font-bold text-orange-500">Bs. {table.currentTotal?.toFixed(2)}</p>
                  </div>
                  <span className="text-[10px] font-black text-orange-500 bg-orange-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                    Observada
                  </span>
                </div>
                {table.observationNote && (
                  <p className="text-xs text-gray-600 font-medium bg-orange-50 p-2 rounded-xl border border-orange-100 mb-3 line-clamp-2">
                    {table.observationNote}
                  </p>
                )}
                <button 
                  onClick={() => handleOpenWalkoutModal(table)}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors shadow-sm">
                  <Eye size={16} /> Ver Detalles y Resolver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
