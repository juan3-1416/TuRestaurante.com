import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/axios"
import { User } from "@/store/authStore"

const ITEMS_PER_PAGE = 5

export function useUsuarios() {
  const queryClient = useQueryClient()

  // Filtros locales
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"Activo" | "Inactivo">("Activo")
  const [currentPage, setCurrentPage] = useState(1)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)

  // 1. Obtener lista de usuarios desde el backend
  const { data: usersData = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users/')
      // Si el backend soporta paginación, response.data podría tener { results: [...] }
      // Aquí asumo que devuelve la lista de resultados directamente o extraigo "results".
      // Dependiendo de tu backend Django DRF:
      return response.data.results || response.data
    }
  })

  // 2. Mutación para alternar estado (is_active)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string | number, is_active: boolean }) => {
      const response = await apiClient.patch(`/users/${id}/`, { is_active })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setCurrentPage(1)
    }
  })

  // Filtrado local
  const filteredUsers = usersData.filter(emp => {
    // Para simplificar la búsqueda unimos first_name y last_name
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
    
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Si is_active es undefined, asumimos true por defecto (Activo)
    const isActive = emp.is_active !== false
    const matchesStatus = statusFilter === "Activo" ? isActive : !isActive

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE))
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (filter: "Activo" | "Inactivo") => {
    setStatusFilter(filter)
    setCurrentPage(1)
  }

  const handleToggleStatus = (id: string | number, currentStatus: "Activo" | "Inactivo") => {
    toggleStatusMutation.mutate({ 
      id, 
      is_active: currentStatus === "Inactivo" // Si está inactivo, lo volvemos true (activo). Si está activo, lo volvemos false (inactivo).
    })
  }

  return {
    paginatedUsers,
    filteredCount: filteredUsers.length,
    isLoading,
    searchTerm,
    statusFilter,
    currentPage,
    totalPages,
    ITEMS_PER_PAGE,
    userToEdit,
    setUserToEdit,
    handleSearchChange,
    handleStatusFilterChange,
    handleToggleStatus,
    setCurrentPage
  }
}
