import { DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Tag, Utensils, Edit } from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Dispatch, SetStateAction } from "react"
import { useTableProductMenu, Product } from "../hooks/useTableProductMenu"

export type { Product }

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
  
  const {
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    cartItems,
    handleAddProduct,
    handleRemoveProduct,
    handleRemoveAllOfProduct
  } = useTableProductMenu({ selectedProducts, setSelectedProducts })

  return (
    <div className="flex flex-col h-full bg-white/50 w-full">
      {/* Cabecera General Fija */}
      <div className="p-6 pb-4 shrink-0 border-b border-gray-100 flex items-center gap-4 bg-white/80 backdrop-blur-md z-20 shadow-sm">
        <button onClick={() => setViewMode("detail")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <DialogTitle className="text-2xl font-black text-restaurante-oscuro tracking-tighter">
            Menú y Orden
          </DialogTitle>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lado Izquierdo: Menú de Productos (2/3 del espacio) */}
        <div className="flex-1 flex flex-col border-r border-gray-100 bg-gray-50/30 overflow-hidden">
          
          {/* Categorías */}
          <div className="p-4 bg-white/60 backdrop-blur-md border-b border-gray-100 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
              <Tag size={16} className="text-gray-400 ml-2 mr-1 shrink-0" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                    selectedCategory === cat
                      ? "bg-restaurante-primario text-white shadow-restaurante-primario/30 scale-105"
                      : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Productos */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const quantity = selectedProducts.filter(p => p.id === product.id).length;
                const isSelected = quantity > 0;

                return (
                  <div 
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] group hover:-translate-y-1 hover:shadow-md ${
                      isSelected 
                        ? 'bg-restaurante-primario/5 border-restaurante-primario shadow-sm' 
                        : 'bg-white border-gray-100 hover:border-restaurante-primario/40'
                    }`}
                  >
                    <div className="mb-2">
                      <p className="font-bold text-restaurante-oscuro leading-tight">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.category}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg text-sm">Bs. {product.price.toFixed(2)}</span>
                      
                      {isSelected ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-restaurante-primario text-white font-bold text-sm shadow-md">
                          {quantity}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 group-hover:bg-restaurante-primario group-hover:border-restaurante-primario group-hover:text-white transition-all">
                          <Plus size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={24} className="text-gray-300" />
                  </div>
                  <p className="text-lg font-medium">No hay productos en esta categoría</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Carrito (1/3 del espacio) */}
        <div className="w-full sm:w-[360px] flex flex-col bg-white shrink-0 relative z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
          
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-black text-lg text-restaurante-oscuro flex items-center gap-2">
              <ShoppingCart size={20} className="text-restaurante-primario" />
              Orden Actual
            </h3>
            <div className="bg-restaurante-primario/10 text-restaurante-primario px-3 py-1 rounded-full text-sm font-bold">
              {selectedProducts.length} items
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                  <ShoppingCart size={32} className="text-gray-300" />
                </div>
                <p>Selecciona productos de la izquierda para agregarlos a la orden.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-800 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">Bs. {(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
                    <button 
                      onClick={() => handleRemoveProduct(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-red-500 hover:shadow-sm text-gray-500 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-restaurante-oscuro">{item.quantity}</span>
                    <button 
                      onClick={() => handleAddProduct(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-restaurante-primario hover:shadow-sm text-gray-500 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button 
                    onClick={() => handleRemoveAllOfProduct(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0 ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="text-2xl font-black text-restaurante-oscuro font-mono">
                Bs. {selectedProducts.reduce((acc, p) => acc + p.price, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <LoadingButton 
                className="w-full bg-linear-to-r from-restaurante-primario to-restaurante-acento hover:from-restaurante-oscuro hover:to-restaurante-primario text-white rounded-xl h-12 text-md font-bold shadow-lg shadow-restaurante-primario/25 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                onClick={() => handleAction("Enviar a Cocina")}
                isLoading={isLoading && actionLoading === "Enviar a Cocina"}
                disabled={selectedProducts.length === 0}
              >
                <Utensils className="mr-2" size={18} /> Enviar a Cocina
              </LoadingButton>
              <LoadingButton 
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl h-12 text-md font-bold transition-all disabled:opacity-50"
                onClick={() => handleAction("Solo Modificar")}
                isLoading={isLoading && actionLoading === "Solo Modificar"}
                disabled={selectedProducts.length === 0}
              >
                <Edit className="mr-2" size={18} /> Solo Modificar
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}