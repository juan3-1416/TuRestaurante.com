import { FileText, DollarSign } from "lucide-react"
import { Transaction } from "@/store/posStore"

interface CajaTransactionHistoryProps {
  isShiftOpen: boolean;
  transactions: Transaction[];
}

export function CajaTransactionHistory({ isShiftOpen, transactions }: CajaTransactionHistoryProps) {
  return (
    <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-lg font-bold text-restaurante-oscuro flex items-center gap-2">
          <FileText className="text-restaurante-primario" size={20} /> Historial del Turno
        </h3>
        <span className="text-xs font-bold text-gray-400 bg-white/50 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
          {isShiftOpen ? transactions.length : 0} movimientos
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200/50">
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Hora</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Método</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Moneda</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {!isShiftOpen ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400 font-medium italic">
                  La caja está cerrada. Abre el turno para visualizar los movimientos.
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400 font-medium italic">
                  No hay movimientos registrados en este turno.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/40 hover:bg-white/50 transition-colors group">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-500">{tx.time}</td>
                  <td className="px-4 py-4 text-sm font-bold text-restaurante-oscuro">{tx.description}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                      tx.method === 'Efectivo' ? 'bg-green-100 text-green-700' :
                      tx.method === 'QR' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {tx.method}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-500">
                    {tx.currency === "USD" ? (
                      <span className="flex items-center gap-1 text-green-600"><DollarSign size={14}/> USD</span>
                    ) : "Bs."}
                  </td>
                  <td className={`px-4 py-4 text-right font-mono font-bold text-base ${
                    tx.type === 'income' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'} Bs. {tx.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
