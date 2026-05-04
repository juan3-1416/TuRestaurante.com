import { DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, ShoppingCart, Plus } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Dispatch, SetStateAction } from "react"

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  cartId?: string; // Añadido para identificar cada unidad de forma única en el carrito
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

  // Función para agregar un producto generando una instancia única
  const handleAddProduct = (product: Product) => {
    const newProductInstance = {
      ...product,
      cartId: crypto.randomUUID() // Genera un ID único para esta unidad específica
    };
    setSelectedProducts([...selectedProducts, newProductInstance]);
  }

  return (
    <>
      {/* Cabecera Fija */}
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
      
      {/* Lista de Productos Scrollable */}
      <div className="px-6 py-6 space-y-4 overflow-y-auto flex-1 bg-gray-50/50 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-1 gap-3">
          {mockProducts.map(product => {
            // Calculamos cuántas unidades de este producto hay en el carrito
            const quantity = selectedProducts.filter(p => p.id === product.id).length;
            const isSelected = quantity > 0;

            return (
              <div 
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group hover:-translate-y-0.5 ${
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
                  
                  {/* Indicador visual de cantidad o botón de agregar */}
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-restaurante-primario border-restaurante-primario text-white font-bold text-xs shadow-md">
                      {quantity}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-300 text-gray-400 group-hover:border-restaurante-primario group-hover:text-restaurante-primario transition-colors">
                      <Plus size={16} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pie de página Fijo */}
      <div className="p-6 bg-white border-t border-gray-100 shrink-0">
        <LoadingButton 
          className="w-full bg-restaurante-primario hover:bg-restaurante-oscuro text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-restaurante-primario/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
          onClick={() => handleAction("Confirmar Pedido")}
          isLoading={isLoading && actionLoading === "Confirmar Pedido"}
          disabled={selectedProducts.length === 0}
        >
          <ShoppingCart className="mr-2" size={20} /> 
          Confirmar ({selectedProducts.length}) - Bs. {selectedProducts.reduce((acc, p) => acc + p.price, 0).toFixed(2)}
        </LoadingButton>
      </div>
    </>
  )
}