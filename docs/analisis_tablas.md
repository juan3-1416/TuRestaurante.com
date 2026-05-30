# Análisis y Documentación de Tablas de Base de Datos

## 1. Módulo de Inventario (`apps.inventory`)

- **`Category` (Categorías):**
  - Campos principales: `name`, `icon`, `is_active`.
  - Lógica: Soporta **Soft Delete**. Si `is_active=False`, se considera eliminada pero no rompe el historial.

- **`Subcategory` (Subcategorías):**
  - Relaciones: Pertenece a una `Category` (CASCADE, si se borra la categoría dura desde BD se borran sus subcategorías).
  - Campos principales: `name`, `is_active`.
  - Lógica: Soporta Soft Delete.

- **`Product` (Productos):**
  - Relaciones: Pertenece a una `Subcategory`.
  - Campos principales: `name`, `price`, `status`, `is_active`.
  - Lógica: Soporta Soft Delete para mantener la integridad de `OrderItem` del historial.

---

## 2. Módulo de Mesas (`apps.tables`)

- **`Table` (Mesas):**
  - Campos principales: `table_number` (Unique), `capacity`, `status`, `is_active`.
  - Lógica: 
    - **Soft Delete:** Se inhabilita cambiando `is_active=False` y liberando la mesa.
    - **Reactivación Automática:** Si se intenta crear una mesa con un número de una mesa inhabilitada, el sistema la revive automáticamente (`is_active=True`).

---

## 3. Módulo de Órdenes (`apps.orders`)

- **`Order` (Órdenes / Pedidos):**
  - Relaciones: Vinculada a una `Table`.
  - Protección: `on_delete=models.PROTECT`. No se puede borrar desde la BD una mesa que tenga pedidos en el historial.
  - Campos principales: `customer_name`, `status` (Pendiente, Pagada, Cancelada), `total`.

- **`OrderItem` (Ítems del Pedido):**
  - Relaciones: Vinculado a `Order` (CASCADE) y `Product` (PROTECT).
  - Protección: No se puede borrar desde BD un producto que ya fue vendido.
  - Campos principales: `quantity`, `price`.
  - Lógica: El precio se "congela" al momento de crearlo copiándolo del producto, para que si el producto cambia de precio mañana, las finanzas históricas no cambien.

---

## 4. Módulo de Caja y Finanzas (`apps.cashier`) [NUEVO]

- **`CashShift` (Turno de Caja):**
  - Relaciones: Vinculado al `User` (Cajero/Admin) que abre el turno.
  - Campos principales: `initial_balance`, `start_time`, `end_time`, `is_open`.
  - Lógica: Guarda un resumen (`total_income`, `total_expense`, `final_balance`) que se calcula automáticamente al hacer el cierre de caja.

- **`Transaction` (Transacciones):**
  - Relaciones: Pertenece a un `CashShift`.
  - Campos principales: `transaction_type` (Ingreso/Egreso), `amount`, `payment_method`, `description`.
  - Lógica: 
    - Los pagos de las mesas (`/pay/`) generan una transacción de Ingreso automática aquí.
    - Los gastos operativos generan transacciones de Egreso.
