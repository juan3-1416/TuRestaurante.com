import { DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Check, ShoppingCart } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Dispatch, SetStateAction } from "react"

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface TableProductMenuProps {
  selectedProducts: Product[]
  setSelectedProducts: Dispatch<SetStateAction<Product[]>>
  setViewMode: (mode: "detail" | "products") => void
  handleAction: (actionName: string) => void
  isLoading: boolean
  actionLoading: string | null
}

export function TableProductMenu({
  selectedProducts,
  setSelectedProducts,
  setViewMode,
  handleAction,
  isLoading,
  actionLoading
}: TableProductMenuProps) {
  const mockProducts: Product[] = [
    { id: 1, name: "Hamburguesa Doble", price: 65.00, category: "Comida" },
    { id: 2, name: "Pizza Familiar", price: 120.00, category: "Comida" },
    { id: 3, name: "Coca-Cola 2L", price: 25.00, category: "Bebida" },
    { id: 4, name: "Cerveza Artesanal", price: 35.00, category: "Bebida" },
  ]

  return (
    <>
      <div className="p-6 pb-4 shrink-0 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode("detail")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <DialogTitle className="text-2xl font-black text-restaurante-oscuro tracking-tighter">
            Menú de Productos
          </DialogTitle>
        </div>
        <div className="bg-restaurante-primario/10 text-restaurante-primario px-3 py-1.5 rounded-xl font-bold flex items-center gap-2">
          <ShoppingCart size={16} />
          {selectedProducts.length} items
        </div>
      </div>
      
      <div className="px-6 py-6 space-y-4 overflow-y-auto flex-1 bg-gray-50/50 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-1 gap-3">
          {mockProducts.map(product => {
            const isSelected = selectedProducts.some(p => p.id === product.id)
            return (
              <div 
                key={product.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedProducts(selectedProducts.filter(p => p.id !== product.id))
                  } else {
                    setSelectedProducts([...selectedProducts, product])
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                  isSelected 
                    ? 'bg-restaurante-primario/5 border-restaurante-primario shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div>
                  <p className="font-bold text-restaurante-oscuro">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-gray-700">Bs. {product.price.toFixed(2)}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isSelected 
                      ? 'bg-restaurante-primario border-restaurante-primario text-white' 
                      : 'border-gray-300 text-transparent'
                  }`}>
                    <Check size={14} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 shrink-0">
        <LoadingButton 
          className="w-full bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-restaurante-primario/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
          onClick={() => handleAction("Confirmar Pedido")}
          isLoading={isLoading && actionLoading === "Confirmar Pedido"}
          disabled={selectedProducts.length === 0}
        >
          <Check className="mr-2" size={20} /> 
          Confirmar ({selectedProducts.length}) - Bs. {selectedProducts.reduce((acc, p) => acc + p.price, 0).toFixed(2)}
        </LoadingButton>
      </div>
    </>
  )
}
