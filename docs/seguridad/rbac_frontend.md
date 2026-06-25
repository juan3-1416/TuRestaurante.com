# Documentación de Seguridad: Control de Acceso Basado en Roles (RBAC) - Frontend

**Estado:** ✅ IMPLEMENTADO / HECHO  
**Fecha de Implementación:** Junio 2026  
**Tecnología:** Next.js (App Router), Zustand, LocalStorage

---

## 1. Resumen de la Solución

Dado que la aplicación almacena la sesión y el token de autenticación en `localStorage` mediante Zustand (`authStore.ts`), la seguridad y el enrutamiento protegido no se manejan a nivel de servidor (Edge Middleware), sino a través de un componente interceptor del lado del cliente denominado **`AuthGuard`**.

Este componente envuelve el layout principal del panel (`DashboardLayout`) impidiendo categóricamente que un usuario acceda a páginas a las que no tiene privilegios, incluso si escribe la URL manualmente en el navegador.

## 2. Matriz de Permisos (Roles vs Rutas)

El sistema reconoce tres roles principales, los cuales tienen acceso estricto a las siguientes secciones de la aplicación:

| Rol | Rutas Permitidas | Ruta por Defecto (Fallback) |
| --- | --- | --- |
| **ADMIN** | `/admin`, `/caja`, `/dashboard`, `/pos`, `/perfil` | `/dashboard` |
| **CASHIER** | `/caja`, `/pos`, `/perfil` | `/caja` |
| **WAITER** | `/pos`, `/perfil` | `/pos` |

> *Cualquier intento de acceso a una ruta no listada en los permisos del rol activo resultará en una redirección forzada a la Ruta por Defecto correspondiente.*

## 3. Arquitectura del Código

### A. El Componente `AuthGuard`
- **Ubicación:** `src/shared/components/AuthGuard.tsx`
- **Funcionamiento:** 
  1. Verifica el estado `isAuthenticated` y `user` en el store de Zustand.
  2. Si no hay sesión, expulsa al usuario hacia `/login`.
  3. Si hay sesión, captura el `pathname` actual y verifica si la lista de `ROLE_ROUTES` permite al `user.role` visualizarla.
  4. Si se deniega el acceso, usa `router.replace()` para empujar al usuario a su ruta por defecto (impidiendo que use el botón de "Atrás" del navegador para volver al error).
  5. Mientras verifica, muestra un indicador de carga para evitar "parpadeos" visuales de la interfaz prohibida.

### B. Integración en el Layout
- **Ubicación:** `src/app/(panel)/layout.tsx`
- **Implementación:**
  ```tsx
  import { DashboardLayout } from "@/shared/layout/DashboardLayout"
  import { AuthGuard } from "@/shared/components/AuthGuard"

  export default function PanelLayout({ children }: { children: React.ReactNode }) {
    return (
      <AuthGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </AuthGuard>
    )
  }
  ```
- **Resultado:** Como todas las páginas internas (`/admin`, `/caja`, etc.) están agrupadas en el layout `(panel)`, **todas** están automáticamente blindadas por este componente.

## 4. Mantenimiento Futuro
Si en el futuro se añade una nueva ruta al panel (por ejemplo, `/inventario`), se debe agregar explícitamente en el diccionario `ROLE_ROUTES` dentro de `AuthGuard.tsx` asignando los roles que tendrán derecho a visualizarla. Si no se agrega, el sistema denegará el acceso a todos los usuarios por seguridad (Zero Trust).
