import { useState, useEffect } from "react"
import { apiClient } from "@/lib/axios"

export interface MenuItem {
  id: number
  name: string
  price: string
  status: string
}

export interface Subcategory {
  id: number
  name: string
  items: MenuItem[]
}

export interface Category {
  id: string
  name: string
  icon: string
  subcategories: Subcategory[]
}

export function useMenuManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [openSubcategories, setOpenSubcategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMenu = async () => {
    try {
      const response = await apiClient.get('/inventory/categories/')
      const data = response.data.results !== undefined ? response.data.results : response.data
      const safeData = Array.isArray(data) ? data : []
      
      setCategories(safeData)
      
      // Auto-expand the first category and its first subcategory if nothing is open yet
      if (safeData.length > 0 && openSections.length === 0) {
        setOpenSections([safeData[0].id.toString()])
        if (safeData[0].subcategories?.length > 0) {
          setOpenSubcategories([safeData[0].subcategories[0].id.toString()])
        }
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
    const strId = id.toString()
    setOpenSections(prev =>
      prev.includes(strId) ? prev.filter(s => s !== strId) : [...prev, strId]
    )
  }

  const toggleSubcategory = (id: string | number) => {
    const strId = id.toString()
    setOpenSubcategories(prev =>
      prev.includes(strId) ? prev.filter(s => s !== strId) : [...prev, strId]
    )
  }

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este platillo? Esta acción no se puede deshacer.")) {
      try {
        await apiClient.delete(`/inventory/products/${productId}/`)
        fetchMenu()
      } catch (error) {
        console.error("Error al eliminar producto", error)
        alert("Hubo un problema al intentar eliminar el platillo.")
      }
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta categoría? Se eliminarán también sus subcategorías y platillos.")) {
      try {
        await apiClient.delete(`/inventory/categories/${categoryId}/`)
        fetchMenu()
      } catch (error) {
        console.error("Error al eliminar categoría", error)
        alert("Hubo un problema al intentar eliminar la categoría.")
      }
    }
  }

  const handleDeleteSubcategory = async (subcategoryId: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta subcategoría? Se eliminarán también sus platillos.")) {
      try {
        await apiClient.delete(`/inventory/subcategories/${subcategoryId}/`)
        fetchMenu()
      } catch (error) {
        console.error("Error al eliminar subcategoría", error)
        alert("Hubo un problema al intentar eliminar la subcategoría.")
      }
    }
  }

  return {
    categories,
    isLoading,
    openSections,
    openSubcategories,
    fetchMenu,
    toggleSection,
    toggleSubcategory,
    handleDeleteProduct,
    handleDeleteCategory,
    handleDeleteSubcategory,
  }
}
