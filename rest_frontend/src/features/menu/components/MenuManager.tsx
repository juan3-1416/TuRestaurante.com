"use client"

import {
  Edit2, Trash2, ChevronDown, ChevronRight,
  Utensils, Coffee, Drumstick, LayoutGrid, LucideIcon
} from "lucide-react"
import { VariantModal } from "./VariantModal"
import { CategoryModal } from "./CategoryModal"
import { SubcategoryModal } from "./SubcategoryModal"
import { useMenuManager } from "../hooks/useMenuManager"

const IconMap: Record<string, LucideIcon> = {
  "Utensils": Utensils,
  "Coffee": Coffee,
  "Drumstick": Drumstick,
  "LayoutGrid": LayoutGrid
}

export function MenuManager() {
  const {
    categories, isLoading,
    openSections, openSubcategories,
    fetchMenu, toggleSection,
    toggleSubcategory, handleDeleteProduct,
    handleDeleteCategory, handleDeleteSubcategory,
  } = useMenuManager()

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
              <div
                className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all duration-300 border ${isOpen
                    ? "bg-restaurante-primario text-white border-transparent shadow-lg"
                    : "bg-white/40 backdrop-blur-md text-restaurante-oscuro border-white/60 hover:bg-white/60"
                  }`}>
                <button onClick={() => toggleSection(cat.id)}
                  className="flex-1 flex items-center gap-4 text-left">
                  <div className={`p-2 rounded-xl ${isOpen ? "bg-white/20" : "bg-restaurante-claro/20"}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight">{cat.name}</span>
                    <span className={`text-xs font-medium mt-0.5 ${isOpen ? "text-white/80" : "text-gray-500"}`}>
                      Categoría • {cat.subcategories?.length || 0} subcategorías
                    </span>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <CategoryModal
                    categoryToEdit={cat}
                    onCategoryCreated={fetchMenu}
                    trigger={
                      <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                    }/>
                  <button onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 hover:bg-white/20 rounded-lg hover:text-red-300 transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => toggleSection(cat.id)} className="p-2">
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>
              </div>

              {/* Contenido Plegable de Categoría */}
              <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                }`}>
                <div className="overflow-hidden space-y-6 pl-6 border-l-2 border-restaurante-claro/30 ml-8">
                  {cat.subcategories?.length === 0 && (
                    <div className="text-sm text-gray-500 italic p-4 text-center bg-white/20 rounded-xl">
                      Aún no hay platillos en esta categoría. Agrega una subcategoría para empezar.
                    </div>
                  )}
                  {cat.subcategories?.map((sub) => {
                    const isSubOpen = openSubcategories.includes(sub.id.toString());
                    return (
                      <div key={sub.id} className="bg-white/50 backdrop-blur-md border border-white shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:bg-white/70">
                        {/* Cabecera de la subcategoría (clicable en toda la barra) */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => toggleSubcategory(sub.id)}
                        >
                          <div className="flex flex-col text-left">
                            <h4 className="text-restaurante-acento font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                              {isSubOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {sub.name}
                            </h4>
                            <span className="text-[10px] text-gray-500 font-medium ml-6 mt-0.5">
                              Subcategoría • {sub.items?.length || 0} platillos
                            </span>
                          </div>
                          
                          {/* Botones de acción (evitamos que el clic se propague al contenedor) */}
                          <div 
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SubcategoryModal
                              subcategoryToEdit={sub}
                              categoryId={cat.id.toString()}
                              categoryName={cat.name}
                              onSubcategoryCreated={fetchMenu}
                              trigger={
                                <button className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-restaurante-acento transition-colors">
                                  <Edit2 size={16} />
                                </button>
                              }
                            />
                            <button
                              onClick={() => handleDeleteSubcategory(sub.id)}
                              className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                            <VariantModal 
                              subcategoryId={sub.id} 
                              subcategoryName={sub.name} 
                              onSuccess={fetchMenu} 
                            />
                          </div>
                        </div>

                        {/* Contenido Plegable de Subcategoría (Platillos) */}
                        <div className={`grid transition-all duration-300 ease-in-out ${isSubOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="grid gap-3 p-4 pt-0">
                              {sub.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white hover:border-restaurante-claro/50 transition-all group/item shadow-sm"
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
                        </div>
                      </div>
                    )
                  })}

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