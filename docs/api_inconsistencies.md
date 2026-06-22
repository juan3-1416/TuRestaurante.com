# Guía de Mapeo de Variables y Errores Comunes (Frontend - Backend)

Este documento detalla los errores de conexión e inconsistencias de variables identificados, y la forma correcta de enviar los datos entre el Frontend en React/Next.js y el Backend en Django Rest Framework.

## 1. Roles de Usuario (`role`)

El error principal que estaba enfrentando el equipo de frontend ocurre al enviar los datos de los roles. El backend espera valores estrictos en **INGLÉS Y MAYÚSCULAS** tal como están definidos en `RoleChoices`.

**🔴 INCORRECTO (Causa del error 400 Bad Request):**
- `"cajero"`
- `"Cajero"`
- `"mesero"`

**✅ CORRECTO (Lo que el Backend acepta):**
- Administrador: `"ADMIN"`
- Cajero: `"CASHIER"`
- Mesero: `"WAITER"`

**Solución para Frontend:** 
El componente Select debe mostrar las palabras en español, pero el atributo `value` enviado en el hook `useCreateUser.ts` debe ser el valor en inglés. 

---

## 2. Creación y Actualización de Usuarios (`/api/users/`)

### Campos omitidos en Frontend:
- **`email`**: El backend (`UserCreateSerializer`) puede recibir el `email`, pero el componente `CreateUserModal.tsx` no tiene este input y `useCreateUser.ts` no lo tiene en su esquema de Zod. Es recomendable agregarlo.

### Manejo de Strings Vacíos vs Nulos:
El frontend tiene una buena práctica al borrar (`delete`) los campos que vienen como string vacío (`""`). Hay que asegurarse de que datos como `bank_account_number` u otros sigan enviándose u omitiéndose correctamente como `undefined`.

---

## 3. Inconsistencia Crítica en Creación de Mesas (`/api/tables/`)

**Esta es una causa directa de error al crear una nueva mesa desde el POS.**

- **El Problema:** El hook `createTable` (en `useTables.ts`) está enviando al backend un payload con la llave `number`:
  ```json
  // Payload enviado por Frontend (Incorrecto)
  { "number": 5, "capacity": 4, "status": "Libre" }
  ```
- **Lo que el Backend espera:** El método `create` en `TableViewSet` intenta leer explícitamente `request.data.get('table_number')`. Al no encontrarlo, rechaza la petición con el error `400: table_number is required`.
- **Solución en Frontend:** El payload JSON en `useTables.ts` debe enviarse como:
  ```json
  // Payload Correcto
  { "table_number": 5, "capacity": 4, "status": "Libre" }
  ```

*Nota: La actualización/edición de la mesa (`editTable`) sí funciona con `number` debido a cómo DRF maneja los serializers en los métodos PUT/PATCH, pero en la creación (POST) falla. Por sanidad, es mejor enviar siempre `table_number`.*

---

## 4. Endpoints de Inventario y "Variantes" (`/api/inventory/`)

- Las peticiones POST para crear Categorías y Subcategorías funcionan correctamente.
- **Aclaración Conceptual:** El Frontend tiene un componente llamado `VariantModal` y un hook `useVariant.ts`. Sin embargo, la ruta a la que apunta el hook es `/inventory/products/` y el payload `{ name, price, status, subcategory }` mapea exactamente a la creación de un `Product` del backend. 
- **Estado:** ✅ **Conectado**. Aunque en el Frontend se le llame "Variante", está creando "Productos" reales en el backend, lo cual es totalmente funcional y no rompe la lógica, solo es un tema de nombrado a tener en cuenta.

---

## 5. Endpoints de la Caja y Cobro (`/api/cashier/`, `/api/orders/`)

Las conexiones de la caja y órdenes mapean perfecto con los controladores del backend:

| Acción | Endpoint Backend | Payload Frontend (JSON) | Estado |
|--------|------------------|----------------|-------------|
| **Obtener Turno** | `GET /api/cashier/shift/current/` | N/A | ✅ Conectado |
| **Abrir Caja** | `POST /api/cashier/shift/open_shift/` | `{ "initial_balance": 100.50 }` | ✅ Conectado |
| **Registrar Gasto** | `POST /api/cashier/transactions/expense/`| `{ "amount": 25.00, "description": "Gasto x" }` | ✅ Conectado |
| **Pagar Orden** | `POST /api/orders/{id}/pay/`| `{ "payment_method": "Efectivo" }` | ✅ Conectado |
