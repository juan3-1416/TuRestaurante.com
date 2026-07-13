# Tickets independientes por mesa (Multi-Pedido)

## Diagnóstico del problema

El comportamiento actual está causado por un **conflicto entre el frontend y el backend**:

### El problema en el backend (`tables/views.py` → `update_status`)
Cuando el frontend envía un nuevo pedido, el backend hace esto:
```python
order = table.orders.filter(status='Pendiente').first()
if not order:
    order = Order.objects.create(table=table)  # Solo crea si NO hay una pendiente
```
Luego borra TODOS los ítems y los reemplaza por los nuevos:
```python
order.items.all().delete()  # ← Borra todo
```
Esto significa que **aunque el frontend manda todos los ítems combinados (viejos + nuevos), el backend los mete a una sola `Order`**, haciendo que visualmente parezca un solo pedido.

### El problema en el frontend (`TableDetailModal.tsx`)
En modo `append`, el frontend ya agrupa correctamente por `orderId`, pero al guardarlo:
```ts
finalOrders = [...existingWithId, ...newMappedOrders]
```
Manda todo en una sola llamada al `update_status`, y el backend lo colapsa todo en una `Order`.

### El problema en Caja (`CajaPaymentModal.tsx`)
Actualmente el modal de caja solo muestra los ítems planos (`orders.map(...)`) sin separar por ticket. Necesita mostrar los tickets individuales separados.

---

## Solución propuesta

La solución tiene **dos capas**: backend y frontend.

### Capa 1: Backend — Crear una nueva `Order` por cada pedido adicional

En lugar de reutilizar la misma `Order` cuando se agrega un nuevo pedido, el backend debe **crear una nueva `Order`** cuando los ítems enviados correspondan a un pedido "nuevo" (indicado por el frontend).

**Estrategia elegida:** El frontend enviará los nuevos ítems en una llamada separada con un nuevo endpoint `add_order`, que siempre creará una `Order` nueva vinculada a la misma mesa. Los pedidos existentes se enviarán en llamadas de actualización normales (`update_status`).

Alternativamente (más simple y sin cambiar la lógica existente): modificar `update_status` para que acepte un parámetro `new_order: true` que le indique que debe crear una `Order` nueva en vez de reutilizar la existente.

**Solución elegida: parámetro `new_order`**

#### Cambio en `backend/apps/tables/interfaces/views.py`
- Al recibir `new_order: true` en el payload, crear una nueva `Order` en vez de buscar la existente.
- El `activeOrderId` que devuelve el serializer sigue apuntando a la primera Order activa, pero el frontend necesita saber el ID de todas las órdenes.

#### Cambio en `backend/apps/tables/interfaces/serializers.py`
- El campo `orders` actualmente solo trae los ítems de LA PRIMERA orden activa. Debe traer ítems de TODAS las órdenes activas (`status='Pendiente'`).
- Agregar un campo `activeOrderIds` (lista) con los IDs de todas las órdenes activas de esa mesa, para que Caja pueda cobrarlas todas.
- Cada ítem debe incluir el `orderId` (ID de la Order del backend) al que pertenece, para que el frontend pueda agruparlos en tickets.

### Capa 2: Frontend — Separar la llamada de "Agregar Pedido"

#### Cambio en `TableDetailModal.tsx`
- En modo `append` (nuevo pedido), en lugar de mandar todos los ítems juntos en `update_status`, hacer una llamada separada que cree una nueva `Order`.
- En modo `edit` (modificar pedido existente), el comportamiento actual se mantiene: reemplaza los ítems del ticket editado en la misma `Order`.

#### Cambio en `useTableStatusDetail.ts`
- Al agrupar los tickets, usar el `orderId` (que ahora vendrá del backend como el ID real de la `Order`) en lugar del `orderId` local del frontend (UUID).

#### Cambio en `CajaPaymentModal.tsx`
- Mostrar los ítems agrupados por `orderId` (ticket) en la sección colapsable de "Detalle del Pedido", igual que en `TableStatusDetail`.

#### Cambio en `useCaja.ts`
- Al cobrar, necesitamos pagar TODAS las `Order` activas de la mesa (no solo la primera). Iterar sobre `activeOrderIds` y llamar `/orders/orders/{id}/pay/` para cada una.

---

## Archivos a modificar

### Backend

---

#### [MODIFY] [views.py](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/backend/apps/tables/interfaces/views.py)
- En `update_status`: si el payload contiene `new_order: true`, crear una `Order` nueva en lugar de reutilizar la existente.
- La lógica de `update_status` para ítems solo aplica a la orden nueva.

#### [MODIFY] [serializers.py](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/backend/apps/tables/interfaces/serializers.py)
- `get_orders`: incluir ítems de **todas** las órdenes activas, agregando `orderId` (ID de la Order del backend) a cada ítem.
- `get_activeOrderId`: se mantiene igual (primera orden).
- Nuevo campo `activeOrderIds`: lista de IDs de todas las órdenes activas.
- Agregar `activeOrderIds` a `Meta.fields`.

### Frontend

---

#### [MODIFY] [posStore.ts](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/store/posStore.ts)
- Agregar campo `activeOrderIds?: (number | string)[]` a la interfaz `Table`.

#### [MODIFY] [useTables.ts](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/pos/hooks/useTables.ts)
- Mapear el nuevo campo `activeOrderIds` del backend.
- Agregar una nueva mutación `addNewOrder` que llame a `update_status` con `new_order: true` y solo los ítems del nuevo pedido.

#### [MODIFY] [TableDetailModal.tsx](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/pos/components/TableDetailModal.tsx)
- En modo `append`, usar la nueva mutación `addNewOrder` en lugar de `updateTableStatus`.
- En modo `edit`, mantener la lógica actual.

#### [MODIFY] [useTableStatusDetail.ts](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/pos/hooks/useTableStatusDetail.ts)
- El `orderId` de cada ítem ahora vendrá del backend (ID numérico real de la `Order`), no de un UUID del frontend.
- La lógica de agrupación se mantiene igual (ya funciona correctamente).

#### [MODIFY] [CajaPaymentModal.tsx](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/caja/components/CajaPaymentModal.tsx)
- En la sección "Detalle del Pedido", agrupar los ítems por `orderId` y mostrarlos como tickets separados (igual que en `TableStatusDetail`).

#### [MODIFY] [useCaja.ts](file:///c:/Materias_FINOR/Ingenieria_Software_1/proyecto_restaurante/frontend-web/rest_frontend/src/features/caja/hooks/useCaja.ts)
- En `handleConfirmPayment`, iterar sobre `selectedTableForPayment.activeOrderIds` y llamar `/orders/orders/{id}/pay/` para cada orden activa.

---

## Decisiones tomadas ✅

> [!NOTE]
> **Cobro en Caja con múltiples tickets → Opción A (confirmada)**
> El cajero ve el total combinado de todas las órdenes activas y confirma en una sola acción.
> Internamente `handleConfirmPayment` itera sobre `activeOrderIds` y llama `/orders/orders/{id}/pay/` para cada una.

> [!NOTE]
> **Modificar pedidos del backend → Habilitado, sin reenviar a cocina (confirmado)**
> El mesero puede modificar un ticket cuyo `orderId` es un número del backend.
> El comportamiento es: `update_status` reemplaza los ítems de ESA orden específica con el `orderId` numérico.
> **No se reenvía a cocina** — el botón cambia de "Enviar a Cocina" a "Solo Modificar" cuando el ticket ya existe en el backend.

---

## Plan de verificación

1. Agregar 2 pedidos a una mesa → verificar que aparezcan como 2 tickets separados.
2. Ir a Caja → verificar que los 2 tickets se muestran separados en el modal de cobro.
3. Confirmar pago → verificar que ambas órdenes quedan como "Pagadas" en el backend.
4. Verificar que modificar un pedido existente sigue funcionando.
5. Verificar que el total acumulado en el mapa de mesas es correcto.
