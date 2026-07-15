"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, Role } from "@/store/authStore";

const ROLE_ROUTES: Record<string, Role[]> = {
  "/admin": ["ADMIN"],
  "/caja": ["ADMIN", "CASHIER"],
  "/dashboard": ["ADMIN"],
  "/pos": ["ADMIN", "CASHIER", "WAITER"],
  "/perfil": ["ADMIN", "CASHIER", "WAITER"],
  "/reportes": ["ADMIN"],
  "/turnos": ["ADMIN", "CASHIER", "WAITER"],
};

const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  ADMIN: "/dashboard",
  CASHIER: "/caja",
  WAITER: "/pos/mesas",
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Verificar si la ruta actual está protegida y si el rol tiene acceso (durante el render)
  const hasAccess = (() => {
    if (!isAuthenticated || !user) return false;
    const currentRole = user.role;
    
    // Si la ruta exacta coincide (ej. /admin) o empieza con ella (ej. /admin/users)
    const matchedRoute = Object.keys(ROLE_ROUTES).find(route => pathname.startsWith(route));

    if (matchedRoute) {
      return ROLE_ROUTES[matchedRoute].includes(currentRole);
    }
    
    // Si la ruta no está mapeada, asumimos que no tiene acceso por seguridad
    return false;
  })();

  useEffect(() => {
    // 2. Si no tiene acceso, manejamos las redirecciones
    if (!hasAccess) {
      if (!isAuthenticated || !user) {
        router.replace("/login");
      } else {
        const fallbackRoute = DEFAULT_ROUTE_BY_ROLE[user.role] || "/login";
        router.replace(fallbackRoute);
      }
    }
  }, [hasAccess, isAuthenticated, user, router]);

  // Mientras verifica o redirige (o antes de montar en el cliente), mostramos un pequeño estado de carga
  if (!isMounted || !hasAccess) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-restaurante-oscuro border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Verificando accesos...</p>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostramos la página normal
  return <>{children}</>;
}
