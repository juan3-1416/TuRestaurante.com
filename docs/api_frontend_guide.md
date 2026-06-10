# Guía de Integración API - Módulo POS y Caja (Para el Frontend)

¡Hola equipo de Frontend! Hemos revisado el Backend y la buena noticia es que **los endpoints reales para Mesas, Caja y Órdenes ya están 100% construidos y operativos**. 

El objetivo ahora es eliminar la data "quemada" (mock data) de Zustand (`posStore.ts`) y conectar los componentes con la API de Django.

---

## 🗑️ 1. Código a Eliminar (Mock Data)

En el archivo `src/store/posStore.ts`:
- **Eliminar** el arreglo `INITIAL_TABLES`.
- **Eliminar** la lógica interna simulada de `processPayment`.
- **Modificar** el estado local de `transactions`, `isShiftOpen` y `shiftInitialBalance`. Estos ya no deben ser controlados localmente por acciones como `toggleShift`, sino que deben ser el reflejo de lo que responda el Backend.

---

## 🔗 2. Endpoints Disponibles para Integrar

Asegúrate de usar tu instancia configurada `apiClient` (que incluye el Token JWT en los headers) para todas estas peticiones.

### 🍽️ Módulo de Mesas (`/api/tables/`)

* **Listar Mesas**
  * `GET /api/tables/`
  * Devuelve el listado de mesas activas con su estado (`Libre`, `Ocupada`, `Reservada`).
* **Actualizar Estado y Pedidos de la Mesa**
  * `PATCH /api/tables/{id}/update_status/`
  * **Body:** 
    ```json
    {
      "status": "Ocupada",
      "customerName": "Juan Pérez", 
      "currentTotal": 150.50,
      "orders": [{ "id": 1, "price": 50.00 }, { "id": 2, "price": 100.50 }]
    }
    ```
  * *Nota de la magia del Backend:* Si pasas el estado a "Ocupada" y envías el arreglo `orders`, el backend **automáticamente** crea la orden y los `OrderItem`. No necesitas hacer múltiples peticiones.

### 💰 Módulo de Caja (`/api/shift/` y `/api/transactions/`)

* **Consultar si hay turno abierto al recargar la página**
  * `GET /api/shift/current/`
  * Devuelve los datos del turno activo. Si retorna error 404, significa que la caja está cerrada (`isShiftOpen = false`).
* **Abrir Turno**
  * `POST /api/shift/open_shift/`
  * **Body:** `{ "initial_balance": 100.00 }`
* **Cerrar Turno**
  * `POST /api/shift/close_shift/`
  * El backend calcula solo los totales (ingresos, egresos, balance final).
* **Registrar Gasto (Egreso)**
  * `POST /api/transactions/expense/`
  * **Body:** `{ "amount": 50.00, "description": "Compra de hielo" }`

### 🧾 Módulo de Cobros y Órdenes (`/api/orders/`)

* **Procesar un Cobro (Pago de Mesa)**
  * `POST /api/orders/{order_id}/pay/`
  * **Body:** `{ "payment_method": "Efectivo" }` *(Opciones: "Efectivo", "QR", "Tarjeta")*
  * *Nota de la magia del Backend:* Al llamar este endpoint, el backend automáticamente:
    1. Marca la orden como `Pagada`.
    2. Registra un ingreso en el turno de caja abierto por el monto total.
    * *(Ojo: Después de cobrar, recuerda llamar a `update_status` de la mesa para pasarla a "Libre" o el backend lo hará si llamas a `update_status` con "Libre").*

---

## 🏗️ 3. Recomendación de Arquitectura (Estado)

Dado que la lógica del negocio ahora recae fuertemente en el backend (ej. transacciones automáticas al cobrar), **la recomendación arquitectónica es optar por "Consumir APIs directamente y usar Caché" (ej. React Query o SWR) en lugar de intentar re-sincronizar Zustand de forma manual.**

**¿Por qué?**
Si intentas mantener Zustand como la fuente de verdad (como está ahora) y solo enviar réplicas al backend, te enfrentarás a problemas de desincronización (ej. si el cajero cobra, el backend crea un ingreso, pero tendrías que simular ese ingreso manualmente en Zustand o volver a pedir toda la lista de transacciones). 

**Flujo ideal propuesto:**
1. Usar SWR / React Query para hacer `GET /api/tables/` y `GET /api/shift/current/`.
2. Al hacer una acción (ej. Cobrar, Agregar Gasto), enviar el `POST` al backend.
3. Al recibir éxito (`200 OK`), invalidar la caché (ej. `mutate('/api/tables/')`) para que la interfaz se re-dibuje sola con los datos frescos y exactos de la Base de Datos.


COMPRUEBA TAMBIEN SI EXISTE CODIGO DE MUESTRA PARA QUE PUEDAS CAMBIARLOS A LLAMADAS APIS