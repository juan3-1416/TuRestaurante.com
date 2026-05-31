"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, X } from "lucide-react"

export interface ReceiptData {
  tableNumber: number;
  cashierName: string;
  method: string;
  items: { name: string; qty: number; subtotal: number }[];
  total: number;
  date: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/90 backdrop-blur-3xl border-white/50 shadow-2xl rounded-[2.5rem] sm:max-w-[400px] p-6">
        
        <DialogHeader className="sr-only">
          <DialogTitle>Recibo de Pago</DialogTitle>
        </DialogHeader>

        {/* Estilos específicos para la impresión nativa */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none;
              background: white;
            }
          }
        `}</style>

        {/* CONTENEDOR DEL TICKET TÉRMICO */}
        <div 
          id="printable-receipt" 
          className="bg-white text-black font-mono p-6 rounded-xl shadow-inner border border-gray-200 mx-auto w-full max-w-[320px]"
        >
          {/* Cabecera del Ticket */}
          <div className="text-center space-y-1 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-2xl font-bold tracking-tighter">TU RESTAURANTE</h2>
            <p className="text-xs">Av. Principal #123, Santa Cruz</p>
            <p className="text-xs">NIT: 123456789</p>
            <p className="text-xs mt-2 font-semibold">TICKET DE VENTA</p>
          </div>

          {/* Datos de la Transacción */}
          <div className="text-xs space-y-1 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <div className="flex justify-between"><span>Fecha:</span> <span>{data.date}</span></div>
            <div className="flex justify-between"><span>Mesa:</span> <span>{data.tableNumber}</span></div>
            <div className="flex justify-between"><span>Cajero:</span> <span>{data.cashierName}</span></div>
            <div className="flex justify-between"><span>Método:</span> <span>{data.method}</span></div>
          </div>

          {/* Lista de Productos */}
          <div className="text-xs mb-4">
            <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-2">
              <span className="w-2/3">Cant  Descripción</span>
              <span className="w-1/3 text-right">Subtotal</span>
            </div>
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between mb-1">
                <span className="w-2/3 truncate">{item.qty}x {item.name}</span>
                <span className="w-1/3 text-right">Bs. {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="text-right border-t-2 border-dashed border-gray-300 pt-3 mb-6">
            <span className="text-sm font-bold mr-4">TOTAL:</span>
            <span className="text-xl font-black">Bs. {data.total.toFixed(2)}</span>
          </div>

          <div className="text-center text-[10px] italic text-gray-500">
            ¡Gracias por su preferencia! <br/>
            Vuelva pronto.
          </div>
        </div>

        {/* Botones de Acción (Ocultos al imprimir) */}
        <div className="pt-6 flex gap-3 print:hidden">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold h-12 rounded-xl flex items-center justify-center transition-colors"
          >
            <X size={18} className="mr-2"/> Cerrar
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 bg-restaurante-oscuro hover:bg-black text-white font-bold h-12 rounded-xl flex items-center justify-center shadow-lg transition-all hover:-translate-y-1"
          >
            <Printer size={18} className="mr-2"/> Imprimir
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}