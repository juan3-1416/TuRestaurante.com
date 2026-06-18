"use client"

import { useState } from "react"
import { Users, Search, ShieldAlert, UserCog, Coffee } from "lucide-react"
import { Role } from "@/store/authStore"
import { CreateUserModal, CreateUserFormValues } from "./CreateUserModal" // <-- IMPORTACIÓN

export interface Empleado {
  id: string;
  username: string;
  name: string;
  role: Role;
  accountNumber: string;
  status: "Activo" | "Inactivo";
}

export function UsuariosDashboard() {
  // Ahora el estado permite agregar nuevos empleados
  const [empleados, setEmpleados] = useState<Empleado[]>([
    { id: "1", username: "admin", name: "Fabián (Admin)", role: "Admin", accountNumber: "1000-2345-67", status: "Activo" },
    { id: "2", username: "cajero_dia", name: "Carlos Mendoza", role: "Cajero", accountNumber: "2000-8888-11", status: "Activo" },
    { id: "3", username: "mesero_1", name: "Ana Torres", role: "Mesero", accountNumber: "3000-9999-22", status: "Activo" },
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredEmpleados = empleados.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  // Función para capturar los datos del Modal y agregarlos a la tabla
  const handleUserCreated = (newUser: CreateUserFormValues) => {
    const empleadoNuevo: Empleado = {
      id: crypto.randomUUID(),
      username: newUser.username,
      name: newUser.name,
      role: newUser.role as Role,
      accountNumber: newUser.accountNumber || "N/A",
      status: "Activo"
    }
    setEmpleados([...empleados, empleadoNuevo])
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* Encabezado */}
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

        {/* Instanciamos el Modal de Creación aquí */}
        <CreateUserModal onUserCreated={handleUserCreated} />
      </div>

      {/* Contenedor Principal */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden">
        
        {/* Barra de Búsqueda */}
        <div className="p-6 border-b border-white/50 bg-white/20">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/60 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-restaurante-primario/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre Completo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Usuario (Login)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Rol del Sistema</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Nº de Cuenta</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpleados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium italic">
                    No se encontraron usuarios con ese término de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredEmpleados.map((emp) => (
                  <tr key={emp.id} className="border-b border-white/40 hover:bg-white/60 transition-colors group">
                    <td className="px-6 py-5 font-bold text-restaurante-oscuro">{emp.name}</td>
                    <td className="py-5 font-mono text-sm text-gray-600 bg-gray-50/50 rounded-lg my-2 inline-block px-3 ml-6 border border-gray-100">
                      @{emp.username}
                    </td>
                    <td className="px-6 py-5">{getRoleBadge(emp.role)}</td>
                    <td className="px-6 py-5 font-mono text-sm text-gray-500">{emp.accountNumber || "N/A"}</td>
                    <td className="px-6 py-5 text-right">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200 shadow-sm">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}