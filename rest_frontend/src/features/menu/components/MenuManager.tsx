"use client"

import { useState, useEffect } from "react"
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  Utensils, Coffee, Drumstick, LayoutGrid
} from "lucide-react"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { VariantModal } from "./VariantModal"

import { apiClient } from "@/lib/axios"

const IconMap: Record<string, any> = {
  "Utensils": Utensils,
  "Coffee": Coffee,
  "Drumstick": Drumstick,
  "LayoutGrid": LayoutGrid
}

export function MenuManager() {
  const [categories, setCategories] = useState<any[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await apiClient.get('/inventory/categories/')
        setCategories(response.data)
        if (response.data.length > 0) {
          setOpenSections([response.data[0].id.toString()])
        }
      } catch (error) {
        console.error("Error fetching menu data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMenu()
  }, [])

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-restaurante-oscuro">Administración de Carta</h2>
          <p className="text-gray-600 text-sm">Gestiona categorías, variantes y precios</p>
        </div>
        <LoadingButton
          isLoading={isActionLoading}
          onClick={() => setIsActionLoading(true)}
          className="bg-restaurante-primario hover:bg-restaurante-acento text-white rounded-2xl px-6"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </LoadingButton>
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
                  {cat.subcategories.map((sub) => (
                    <div key={sub.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-restaurante-acento font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                          <ChevronRight size={14} /> {sub.name}
                        </h4>
                        <VariantModal subcategoryName={sub.name} />
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
                                <button className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-restaurante-acento transition-colors">
                                  <Edit2 size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}