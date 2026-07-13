# Plan de Implementación Frontend — Nuevas Funcionalidades

> **Para:** Compañero de equipo (Frontend Developer)  
> **Contexto:** El backend ya ha sido actualizado con los nuevos campos y endpoints para soportar el seguimiento de meseros, control de turnos, fugas (walkouts) y pedidos "para llevar".  

Aquí tienes la hoja de ruta con los cambios necesarios en el Frontend.

---

## 1. Funcionalidad "Para Llevar" por Ítem

### A. Tipado e Interfaces (store/posStore.ts y hooks)
- Añadir `isTakeaway?: boolean;` a la interfaz `OrderItem`.
- Añadir `isTakeaway?: boolean;` a la interfaz `Product` en `useTableProductMenu.ts`.

### B. UI de Caja y Carrito (TableProductMenu.tsx)
- En el `useMemo` de `cartItems`, modifica la lógica para que agrupe por `curr.id` **Y** `curr.isTakeaway`. De esta forma, si eligen "1 Pizza" y "1 Pizza (Para llevar)", se verán como dos filas separadas.
- En la interfaz del Carrito (lado derecho), añade un botón pequeño (tipo Toggle) con un icono de bolsa (🥡) al lado de cada ítem. Al presionarlo, invertirá el estado `isTakeaway` de esa instancia.
- El objeto final que envíes en `orders` dentro de `updateTableStatus` debe incluir `isTakeaway: true|false`.

### C. Visualización de Pedidos Confirmados (TableStatusDetail.tsx)
- Si un ítem en `ticket.items` tiene `isTakeaway` en `true`, muestra una pequeña etiqueta visual como `[🥡 Para llevar]` junto a su nombre.

---

## 2. Control de Turnos de Empleados (Employee Shifts)

Se han creado endpoints para iniciar y finalizar turnos de empleados (meseros).

### A. Endpoints a consumir
- **`POST /users/shifts/start/`**: Inicia el turno del usuario logueado. Devuelve los datos del turno.
- **`POST /users/shifts/end/`**: Finaliza el turno del usuario logueado. Puedes enviar `{"observations": "algún texto"}` en el body.
- **`GET /users/shifts/`**: Retorna el historial de turnos. Incluye el campo `generated_income` que calcula automáticamente los ingresos generados (órdenes pagadas) por ese empleado durante ese turno.

### B. UI Necesaria
- En la barra lateral o en el panel de perfil del mesero, añade un botón **"Iniciar Turno"** / **"Finalizar Turno"**.
- Muestra una tabla o historial donde cada empleado pueda ver sus turnos pasados y el `generated_income` total de cada uno.

---

## 3. Manejo de Fugas (Clientes que se van sin pagar)

El backend maneja esto bloqueando la mesa (`Observada`) hasta que el cajero la libere.

### A. Interfaz del Mesero (TableStatusDetail.tsx)
- Agrega un botón **"Reportar Fuga"** o "Se fue sin pagar".
- Al presionarlo, abre un modal solicitando una observación/motivo.
- Envía un `PATCH` a `/tables/{id}/report_walkout/` con el body `{"note": "Motivo..."}`.
- La mesa cambiará a estado `Observada` y no se podrá usar.

### B. Interfaz del Cajero (CajaDashboard.tsx / Pending Tables)
- En la lista de mesas pendientes, las mesas en estado `Observada` deben destacar (ej. en color rojo o naranja).
- Al seleccionar una mesa `Observada`, muestra el detalle de la orden pendiente y la `observation_note`.
- Agrega un botón **"Resolver Fuga"** que envíe un `PATCH` a `/tables/{id}/resolve_walkout/`. Esto liberará la mesa (`Libre`) y cancelará la orden en la base de datos de manera limpia, dejando un registro permanente para auditorías.

---

## 4. Mejora de Reapertura de Mesas (Mesas sin pedido)

- Si el mesero cambia el estado de una mesa a `Libre` pero la orden vinculada tenía un total de `0` (porque nunca agregó productos), el backend ahora automáticamente cambiará el estado de la orden a `Cancelada` en vez de `Pagada`.
- En el frontend, solo asegúrate de permitir cambiar a estado `Libre` (o tener un botón "Cancelar Apertura") incluso si no hay ítems en la orden. Manda el request a `update_status` con `status: "Libre"`.
