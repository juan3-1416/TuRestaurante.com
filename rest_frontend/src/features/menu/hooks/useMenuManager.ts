import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  const [openSections, setOpenSections] = useState<string[]>([])
  const [openSubcategories, setOpenSubcategories] = useState<string[]>([])
  const queryClient = useQueryClient()

  // 1. Fetch Categories con React Query
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/categories/')
      const data = response.data.results !== undefined ? response.data.results : response.data
      const safeData = Array.isArray(data) ? data : []
      
      // Auto-expand the first category and its first subcategory si no hay nada abierto
      if (safeData.length > 0 && openSections.length === 0) {
        setOpenSections([safeData[0].id.toString()])
        if (safeData[0].subcategories?.length > 0) {
          setOpenSubcategories([safeData[0].subcategories[0].id.toString()])
        }
      }

      return safeData
    }
  })

  // 2. Mutaciones de eliminación
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiClient.delete(`/inventory/products/${productId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
    },
    onError: (error) => {
      console.error("Error al eliminar producto", error)
      alert("Hubo un problema al intentar eliminar el platillo.")
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await apiClient.delete(`/inventory/categories/${categoryId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
    },
    onError: (error) => {
      console.error("Error al eliminar categoría", error)
      alert("Hubo un problema al intentar eliminar la categoría.")
    }
  })

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (subcategoryId: number) => {
      await apiClient.delete(`/inventory/subcategories/${subcategoryId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
    },
    onError: (error) => {
      console.error("Error al eliminar subcategoría", error)
      alert("Hubo un problema al intentar eliminar la subcategoría.")
    }
  })

  // Funciones de UI
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

  // Handlers
  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este platillo? Esta acción no se puede deshacer.")) {
      deleteProductMutation.mutate(productId)
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta categoría? Se eliminarán también sus subcategorías y platillos.")) {
      deleteCategoryMutation.mutate(categoryId)
    }
  }

  const handleDeleteSubcategory = (subcategoryId: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta subcategoría? Se eliminarán también sus platillos.")) {
      deleteSubcategoryMutation.mutate(subcategoryId)
    }
  }

  return {
    categories,
    isLoading,
    openSections,
    openSubcategories,
    toggleSection,
    toggleSubcategory,
    handleDeleteProduct,
    handleDeleteCategory,
    handleDeleteSubcategory,
  }
}
