import { useState } from "react"
import { Role } from "@/store/authStore"
import { CreateUserFormValues } from "../components/CreateUserModal"
import { EditUserFormValues } from "../components/EditUserModal"

export interface Empleado {
  id: string;
  username: string;
  name: string;
  role: Role;
  accountNumber: string;
  status: "Activo" | "Inactivo";
  address?: string; // Lo añadimos para soportar el campo opcional
}

const ITEMS_PER_PAGE = 5

export function useUsuarios() {
  const [empleados, setEmpleados] = useState<Empleado[]>([
    { id: "1", username: "admin", name: "Fabián (Admin)", role: "Admin", accountNumber: "1000-2345-67", status: "Activo" },
    { id: "2", username: "cajero_dia", name: "Carlos Mendoza", role: "Cajero", accountNumber: "2000-8888-11", status: "Activo" },
    { id: "3", username: "mesero_1", name: "Ana Torres", role: "Mesero", accountNumber: "3000-9999-22", status: "Activo" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  // Filtro de estado: por defecto muestra solo Activos
  const [statusFilter, setStatusFilter] = useState<"Activo" | "Inactivo">("Activo")
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)

  // Estados para controlar la edición
  const [userToEdit, setUserToEdit] = useState<Empleado | null>(null)

  // Filtra por búsqueda de texto Y por estado seleccionado
  const filteredEmpleados = empleados.filter(emp =>
    (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.username.toLowerCase().includes(searchTerm.toLowerCase())) &&
    emp.status === statusFilter
  )

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(filteredEmpleados.length / ITEMS_PER_PAGE))
  const paginatedEmpleados = filteredEmpleados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Resetear a página 1 si cambia el filtro o la búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (filter: "Activo" | "Inactivo") => {
    setStatusFilter(filter)
    setCurrentPage(1)
  }

  // CREATE (Crear)
  const handleUserCreated = (newUser: CreateUserFormValues) => {
    const empleadoNuevo: Empleado = {
      id: crypto.randomUUID(),
      username: newUser.username,
      name: newUser.name,
      role: newUser.role as Role,
      accountNumber: newUser.accountNumber || "N/A",
      address: newUser.address,
      status: "Activo"
    }
    setEmpleados([...empleados, empleadoNuevo])
  }

  // UPDATE (Editar)
  const handleUserEdited = (id: string, updatedData: EditUserFormValues) => {
    setEmpleados(empleados.map(emp => 
      emp.id === id 
        ? { 
            ...emp, 
            name: updatedData.name, 
            username: updatedData.username, 
            role: updatedData.role as Role,
            accountNumber: updatedData.accountNumber || "N/A",
            address: updatedData.address
          } 
        : emp
    ))
  }

  // SOFT DELETE (Borrado lógico / Cambio de estado)
  const handleToggleStatus = (id: string) => {
    setEmpleados(empleados.map(emp => 
      emp.id === id 
        ? { ...emp, status: emp.status === "Activo" ? "Inactivo" : "Activo" } 
        : emp
    ))
    // Al cambiar estado, resetear página para evitar quedar en una página vacía
    setCurrentPage(1)
  }

  return {
    paginatedEmpleados,
    filteredCount: filteredEmpleados.length,
    searchTerm,
    statusFilter,
    currentPage,
    totalPages,
    ITEMS_PER_PAGE,
    userToEdit,
    setUserToEdit,
    handleSearchChange,
    handleStatusFilterChange,
    handleUserCreated,
    handleUserEdited,
    handleToggleStatus,
    setCurrentPage
  }
}
