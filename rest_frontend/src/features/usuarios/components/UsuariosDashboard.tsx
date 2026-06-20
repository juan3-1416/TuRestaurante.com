"use client"

import { Users, Search, ShieldAlert, UserCog, Coffee, Edit2, UserMinus, UserCheck } from "lucide-react"
import { Role } from "@/store/authStore"
import { CreateUserModal } from "./CreateUserModal"
import { EditUserModal } from "./EditUserModal"
import { Pagination } from "@/components/ui/Pagination"
import { useUsuarios } from "../hooks/useUsuarios"

export function UsuariosDashboard() {
  const {
    paginatedEmpleados, filteredCount,
    searchTerm, statusFilter,
    currentPage, totalPages, ITEMS_PER_PAGE,
    userToEdit, setUserToEdit,
    handleSearchChange, handleStatusFilterChange,
    handleUserCreated, handleUserEdited, 
    handleToggleStatus, setCurrentPage
  } = useUsuarios()

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "Admin":
        return <span className="flex w-max items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-black text-xs uppercase tracking-wider"><ShieldAlert size={14} /> Admin</span>
      case "Cajero":
        return <span className="flex w-max items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-black text-xs uppercase tracking-wider"><UserCog size={14} /> Cajero</span>
      case "Mesero":
        return <span className="flex w-max items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-black text-xs uppercase tracking-wider"><Coffee size={14} /> Mesero</span>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-restaurante-oscuro tracking-tight drop-shadow-sm flex items-center gap-3">
            <div className="p-3 bg-restaurante-primario/10 text-restaurante-primario rounded-2xl">
              <Users size={28} />
            </div>
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-2 font-medium ml-1">
            Administra los accesos, contraseñas y roles del personal.
          </p>
        </div>

        <CreateUserModal onUserCreated={handleUserCreated} />
      </div>

      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden">
        
        {/* Barra de búsqueda + filtro de estado */}
        <div className="p-6 border-b border-white/50 bg-white/20 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/60 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-restaurante-primario/20 focus:bg-white transition-all"
            />
          </div>

          {/* Filtro Activos / Inactivos */}
          <div className="flex items-center bg-white/70 border border-gray-200 rounded-xl p-1 gap-1 shrink-0">
            <button
              onClick={() => handleStatusFilterChange("Activo")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                statusFilter === "Activo"
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}>
              <UserCheck size={14} /> Activos
            </button>
            <button
              onClick={() => handleStatusFilterChange("Inactivo")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                statusFilter === "Inactivo"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}>
              <UserMinus size={14} /> Inactivos
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre Completo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Usuario (Login)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Rol del Sistema</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmpleados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium italic">
                    No se encontraron usuarios {statusFilter === "Inactivo" ? "inactivos" : "activos"}{searchTerm ? " con ese término de búsqueda" : ""}.
                  </td>
                </tr>
              ) : (
                paginatedEmpleados.map((emp) => (
                  <tr key={emp.id} className={`border-b border-white/40 transition-colors group ${emp.status === "Inactivo" ? "bg-gray-50/30 opacity-75" : "hover:bg-white/60"}`}>
                    <td className="px-6 py-5 font-bold text-restaurante-oscuro">{emp.name}</td>
                    <td className="py-5 font-mono text-sm text-gray-600 bg-gray-50/50 rounded-lg my-2 inline-block px-3 ml-6 border border-gray-100">
                      @{emp.username}
                    </td>
                    <td className="px-6 py-5">{getRoleBadge(emp.role)}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                        emp.status === "Activo" 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-red-100 text-red-700 border-red-200"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setUserToEdit(emp)}
                          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-restaurante-primario hover:border-restaurante-primario/30 hover:bg-restaurante-primario/5 transition-all shadow-sm"
                          title="Editar Usuario">
                          <Edit2 size={16} />
                        </button>
                        
                        <button 
                          onClick={() => handleToggleStatus(emp.id)}
                          className={`p-2 rounded-xl border transition-all shadow-sm ${
                            emp.status === "Activo"
                            ? "bg-white border-red-100 text-red-400 hover:text-white hover:bg-red-500"
                            : "bg-white border-green-100 text-green-500 hover:text-white hover:bg-green-500"
                          }`}
                          title={emp.status === "Activo" ? "Desactivar Usuario" : "Activar Usuario"}
                        >
                          {emp.status === "Activo" ? <UserMinus size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel={`usuarios ${statusFilter === "Inactivo" ? "inactivos" : "activos"}`}
        />
      </div>

      {/* Renderizamos el Modal de Edición que se mostrará solo si hay un usuario seleccionado */}
      <EditUserModal 
        userToEdit={userToEdit}
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        onUserEdited={handleUserEdited}
      />
    </div>
  )
}