# Guía de Integración API - Frontend

¡Hola equipo de Frontend! Hemos actualizado y unificado la arquitectura del Backend. A continuación, les detallamos todos los endpoints disponibles y cómo deben conectar los nuevos componentes de React.

---

## 🚨 1. Cambios Críticos (Solución al Error 404 en Login)

### Módulo de Autenticación (`LoginForm.tsx` y `authStore.ts`)
Para estandarizar las rutas RESTful, **hemos cambiado la ruta base de autenticación de `/api/auth/` a `/api/users/`**.

* **Login (Obtener Token)**
  * ❌ *Antes:* `POST /api/auth/token/`
  * ✅ **NUEVO:** `POST /api/users/token/`
  * **Acción requerida:** En `src/features/auth/components/LoginForm.tsx` línea 44, cambiar a `await api.post('/users/token/', values)`.

* **Refrescar Token**
  * `POST /api/users/token/refresh/`

---

## 🔗 2. Endpoints Disponibles por Módulo

Asegúrense de usar su instancia `apiClient` configurada para que inyecte automáticamente el token JWT en cada petición.

### 👤 Usuarios y Perfil (`/api/users/`)
*Componentes:* `UsuariosDashboard.tsx`, `CreateUserModal.tsx`, `Sidebar.tsx`, `PerfilDashboard.tsx`
* **Mi Perfil (`GET /api/users/me/`)**: Devuelve los datos del usuario logueado. Es **vital** que `authStore.ts` consuma esta ruta al iniciar la app para guardar el `role` y determinar qué ve el usuario (Admin, Cajero, Mesero).
* **Actualizar Mi Perfil (`PUT /api/users/me/`)**: Para editar los propios datos.
* **Listar Usuarios (`GET /api/users/`)**: Devuelve la lista paginada de usuarios.
* **Crear / Editar Usuario (`POST /api/users/`, `PUT /api/users/{id}/`)**. 
  * *Campos Disponibles:* `username`, `password`, `email`, `first_name` (Nombre), `last_name` (Apellidos), `role`, **`address`** (Dirección), **`phone_number`** (Teléfono), **`bank_account_number`** (Cuenta bancaria).

### 🍽️ Módulo de Mesas (`/api/tables/`)
*Componentes:* `posStore.ts`, `TableStatusDetail.tsx`
* **Listar Mesas (`GET /api/tables/`)**: Devuelve las mesas y su estado (`Libre`, `Ocupada`, `Reservada`).
* **Actualizar Estado y Pedidos (`PATCH /api/tables/{id}/update_status/`)**:
  * **Body:** `{ "status": "Ocupada", "customerName": "Juan", "orders": [{ "id": 1, "price": 50 }] }`
  * *Magia Backend:* Al pasar a "Ocupada" y enviar productos, el backend crea la orden y los items automáticamente.

### 🧾 Módulo de Órdenes (`/api/orders/`)
* **Cobrar Orden (`POST /api/orders/{order_id}/pay/`)**:
  * **Body:** `{ "payment_method": "Efectivo" }` (Opciones: "Efectivo", "Tarjeta", "QR").
  * *Magia Backend:* Esto marca la orden como pagada y **automáticamente crea un ingreso en la Caja** si hay un turno abierto. (Luego de cobrar, llamen a `update_status` de la mesa con estado "Libre").

### 💰 Módulo de Caja (`/api/cashier/`)
*Componentes:* `CajaDashboard.tsx`, `OpenShiftModal.tsx`, `CloseShiftModal.tsx`, `ExpenseModal.tsx`
* **Consultar Turno Actual (`GET /api/cashier/shift/current/`)**: Devuelve los datos del turno y **todas sus transacciones anidadas**. (Si da 404, la caja está cerrada).
* **Abrir Turno (`POST /api/cashier/shift/open_shift/`)**: `{ "initial_balance": 100.00 }`
* **Cerrar Turno (`POST /api/cashier/shift/close_shift/`)**: El backend calcula todo solo.
* **Registrar Gasto (`POST /api/cashier/transactions/expense/`)**: `{ "amount": 50.00, "description": "Hielo" }`

### 🍔 Menú e Inventario (`/api/inventory/`)
*Componentes:* `MenuManager.tsx`, `VariantModal.tsx`, `TableProductMenu.tsx`
* **Listar Productos (`GET /api/inventory/products/`)**: Incluye la categoría y el **nuevo array de `variants`** anidado.
* **Variantes (`GET / POST / PUT /api/inventory/variants/`)**: Nuevo endpoint para crear y gestionar variantes (ej. Grande, Mediana) asignadas a un producto.
* **Categorías (`GET /api/inventory/categories/`)** y **Subcategorías (`GET /api/inventory/subcategories/`)**.

---

## 🗑️ 3. Código a Limpiar / Refactorizar (Mock Data)

Para que todo esto funcione correctamente, por favor limpien la data quemada (mocks) del frontend:

1. **`src/features/auth/components/LoginForm.tsx`**: Cambiar la ruta del POST a `/users/token/`.
2. **`src/store/posStore.ts`**: Eliminar `INITIAL_TABLES` y la función falsa `processPayment`. Todo debe salir de un fetch a `/api/tables/`.
3. **`src/features/caja/hooks/useCaja.ts`**: Asegúrense de no manipular el balance localmente. Cuando se llame a la ruta de gastos, hagan un "refetch" de `GET /api/cashier/shift/current/` para actualizar la UI con el cálculo del backend.
4. **`src/store/authStore.ts`**: Agregar una función `fetchUser()` que llame a `GET /api/users/me/` tan pronto el token exista, y guarde el `role` en el estado de Zustand para usarlo en el layout de permisos.

---

## 🏗️ 4. Recomendación de Arquitectura (Gestión de Estado)

Dado que la lógica fuerte y matemática del negocio (como calcular totales de caja o generar órdenes) recae totalmente en el Backend, **la recomendación arquitectónica es optar por "Consumir APIs directamente y usar Caché" (ej. usando SWR o React Query) en lugar de intentar re-sincronizar y mantener Zustand de forma manual para datos de la base de datos.**

**¿Por qué evitar Zustand para datos de la API?**
Si intentan mantener Zustand como la fuente de verdad (como estaban los mocks) y solo envían peticiones al backend, se enfrentarán a problemas de desincronización graves. Por ejemplo: si el cajero cobra una mesa, el backend automáticamente crea un ingreso en la caja. Si usan Zustand, tendrían que simular ese ingreso manualmente o escribir código extra para sincronizar el store local.

**El Flujo Ideal Propuesto (Llamadas Directas):**
1. Usar SWR / React Query para hacer `GET /api/tables/` y `GET /api/cashier/shift/current/`.
2. Al hacer una acción (ej. Cobrar, Agregar Gasto), enviar directamente el `POST` al backend.
3. Al recibir éxito (`200 OK`), simplemente invalidar la caché (ej. `mutate('/api/tables/')`) para que la interfaz haga un refetch automático y se redibuje con los datos exactos e infalibles de la Base de Datos.
4. **Zustand** se recomienda mantener **únicamente** para el estado global visual (ej. Sidebar abierto/cerrado, Tema Claro/Oscuro) y la sesión inicial (token y rol de Auth).