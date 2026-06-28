"use client"

import { useAuthStore, Role } from "@/store/authStore"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: Role[] // Si no se pasa, solo verifica que haya iniciado sesión
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  // Calculamos la autorización directamente durante el renderizado
  const isAuthorized = (() => {
    // Si no hay sesión, no tiene acceso
    if (!isAuthenticated) return false;
    
    // Si el componente exige roles específicos
    if (allowedRoles) {
      // Si por alguna razón el usuario aún no carga, prevenimos el acceso por seguridad
      if (!user?.role) return false;
      // Verificamos si su rol está permitido
      return allowedRoles.includes(user.role);
    }
    
    // Si no se exigieron roles específicos (allowedRoles es undefined), 
    // basta con estar autenticado
    return true;
  })();

  // Si no está autorizado para ver este componente, simplemente no renderizamos nada
  if (!isAuthorized) {
    return null;
  }

  // Si pasa los filtros, renderizamos los componentes hijos
  return <>{children}</>;
}