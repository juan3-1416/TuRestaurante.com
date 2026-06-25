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
};

const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  ADMIN: "/dashboard",
  CASHIER: "/caja",
  WAITER: "/pos",
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Si no está autenticado, lo mandamos al login
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const currentRole = user.role;

    // 2. Verificar si la ruta actual está protegida y si el rol tiene acceso
    let hasAccess = false;
    
    // Si la ruta exacta coincide (ej. /admin) o empieza con ella (ej. /admin/users)
    const matchedRoute = Object.keys(ROLE_ROUTES).find(route => pathname.startsWith(route));

    if (matchedRoute) {
      hasAccess = ROLE_ROUTES[matchedRoute].includes(currentRole);
    } else {
      // Si la ruta no está mapeada, asumimos que no tiene acceso por seguridad
      hasAccess = false;
    }

    if (hasAccess) {
      setIsAuthorized(true);
    } else {
      // 3. Si no tiene acceso, lo mandamos a su ruta por defecto según su rol
      const fallbackRoute = DEFAULT_ROUTE_BY_ROLE[currentRole] || "/login";
      router.replace(fallbackRoute);
    }
  }, [isAuthenticated, user, pathname, router]);

  // Mientras verifica o redirige, mostramos un pequeño estado de carga
  if (!isAuthorized) {
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
