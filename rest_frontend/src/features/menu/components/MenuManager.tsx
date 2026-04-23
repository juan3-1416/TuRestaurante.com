"use client"

import { useState, useEffect } from "react"
import {
  Edit2, Trash2, ChevronDown, ChevronRight,
  Utensils, Coffee, Drumstick, LayoutGrid, LucideIcon
} from "lucide-react"
import { VariantModal } from "./VariantModal"
import { CategoryModal } from "./CategoryModal"
import { SubcategoryModal } from "./SubcategoryModal"

import { apiClient } from "@/lib/axios"

// --- Tipos para los datos de la API ---
interface MenuItem {
  id: number
  name: string
  price: string
  status: string
}
interface Subcategory {
  id: number
  name: string
  items: MenuItem[]
}
interface Category {
  id: string
  name: string
  icon: string
  subcategories: Subcategory[]
}

const IconMap: Record<string, LucideIcon> = {
  "Utensils": Utensils,
  "Coffee": Coffee,
  "Drumstick": Drumstick,
  "LayoutGrid": LayoutGrid
}

export function MenuManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMenu = async () => {
    try {
      const response = await apiClient.get('/inventory/categories/')
      // Algunos backends como Django REST devuelven los datos dentro de "results" cuando hay paginación.
      const data = response.data.results !== undefined ? response.data.results : response.data
      
      // Aseguramos que sea un array para evitar errores en el .map
      const safeData = Array.isArray(data) ? data : []
      
      setCategories(safeData)
      if (safeData.length > 0 && openSections.length === 0) {
        setOpenSections([safeData[0].id.toString()])
      }
    } catch (error) {
      console.error("Error fetching menu data", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  const toggleSection = (id: string | number) => {
    const strId = id.toString();
    setOpenSections(prev =>
      prev.includes(strId) ? prev.filter(s => s !== strId) : [...prev, strId]
    )
  }

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este platillo? Esta acción no se puede deshacer.")) {
      try {
        await apiClient.delete(`/inventory/products/${productId}/`)
        fetchMenu() // Recargamos para ver los cambios
      } catch (error) {
        console.error("Error al eliminar producto", error)
        alert("Hubo un problema al intentar eliminar el platillo.")
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-restaurante-oscuro">Administración de Carta</h2>
          <p className="text-gray-600 text-sm">Gestiona categorías, variantes y precios</p>
        </div>
        <CategoryModal onCategoryCreated={fetchMenu} />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center p-8 text-white">Cargando menú...</div>
        ) : categories.map((cat) => {
          const isOpen = openSections.includes(cat.id.toString());
          const Icon = IconMap[cat.icon] || Utensils;

          return (
            <div key={cat.id} className="group overflow-hidden">
              {/* Encabezado de Categoría (Acordeón) */}
              <button
                onClick={() => toggleSection(cat.id)}
                className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all duration-300 border ${isOpen
                    ? "bg-restaurante-primario text-white border-transparent shadow-lg"
                    : "bg-white/40 backdrop-blur-md text-restaurante-oscuro border-white/60 hover:bg-white/60"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${isOpen ? "bg-white/20" : "bg-restaurante-claro/20"}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-bold text-lg">{cat.name}</span>
                </div>
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>

              {/* Contenido Plegable */}
              <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                }`}>
                <div className="overflow-hidden space-y-6 pl-6 border-l-2 border-restaurante-claro/30 ml-8">
                  {cat.subcategories?.length === 0 && (
                    <div className="text-sm text-gray-500 italic p-4 text-center bg-white/20 rounded-xl">
                      Aún no hay platillos en esta categoría. Agrega una subcategoría para empezar.
                    </div>
                  )}
                  {cat.subcategories?.map((sub) => (
                    <div key={sub.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-restaurante-acento font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                          <ChevronRight size={14} /> {sub.name}
                        </h4>
                        <VariantModal 
                          subcategoryId={sub.id} 
                          subcategoryName={sub.name} 
                          onSuccess={fetchMenu} 
                        />
                      </div>

                      <div className="grid gap-3">
                        {sub.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/50 hover:border-restaurante-claro/50 transition-all group/item"
                          >
                            <span className="font-semibold text-restaurante-oscuro">{item.name}</span>
                            <div className="flex items-center gap-6">
                              <span className="font-mono font-bold text-restaurante-primario">Bs. {parseFloat(item.price).toFixed(2)}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.status === "Disponible"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                                }`}>
                                {item.status}
                              </span>
                                <div className="flex gap-1">
                                  <VariantModal
                                    subcategoryId={sub.id}
                                    onSuccess={fetchMenu}
                                    itemToEdit={item}
                                    trigger={
                                      <button className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-restaurante-acento transition-colors">
                                        <Edit2 size={14} />
                                      </button>
                                    }
                                  />
                                  <button 
                                    onClick={() => handleDeleteProduct(item.id)}
                                    className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Botón para agregar nueva subcategoría */}
                  <div className="pt-2">
                    <SubcategoryModal 
                      categoryId={cat.id.toString()} 
                      categoryName={cat.name} 
                      onSubcategoryCreated={fetchMenu} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}