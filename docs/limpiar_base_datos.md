# Guía para Limpiar la Base de Datos en Docker

Si necesitas resetear tu sistema (borrar mesas, productos, categorías, órdenes, turnos de caja y usuarios empleados) pero **mantener tu cuenta de superusuario o administrador**, puedes hacerlo de manera segura utilizando el shell de Django a través de Docker.

## Comando Único de Limpieza

Abre tu terminal en la raíz del proyecto (donde está el `docker-compose.yml`) y ejecuta el siguiente comando. 

Este comando utiliza el ORM de Django dentro de tu contenedor `backend` para eliminar todos los registros de los módulos del restaurante, pero respeta la regla de ignorar a los usuarios que tengan el permiso `is_superuser=True`.

**Copia y pega este bloque en tu terminal de Windows/Linux/Mac (con los contenedores corriendo):**

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.inventory.infrastructure.models import Category
from apps.tables.infrastructure.models import Table
from apps.orders.infrastructure.models import Order
from apps.cashier.infrastructure.models import CashShift

print('Eliminando Inventario...')
Category.objects.all().delete()

print('Eliminando Mesas y Órdenes...')
Table.objects.all().delete()
Order.objects.all().delete()

print('Eliminando Turnos de Caja y Transacciones...')
CashShift.objects.all().delete()

print('Eliminando Usuarios regulares (conservando Superusuarios)...')
User = get_user_model()
User.objects.filter(is_superuser=False).delete()

print('✅ Base de datos limpiada exitosamente.')
"
```

### ¿Qué hace exactamente este comando?
1. **Inventario:** Al eliminar `Category`, Django aplica una eliminación en cascada (Cascade Delete) que borrará automáticamente todas las subcategorías, productos y variantes que dependían de estas categorías.
2. **Mesas y Órdenes:** Elimina todas las mesas. Si hubiese órdenes, las elimina, borrando consigo los `OrderItem` (los detalles de la factura).
3. **Caja:** Borra los turnos de caja (`CashShift`), lo cual eliminará en cascada todos los pagos y gastos (`Transaction`).
4. **Usuarios:** Filtra el modelo de usuarios base y elimina únicamente a cajeros, meseros o administradores regulares, dejando vivos a los Superusuarios del panel de Django.

---

## Alternativa Extrema (Si quieres borrar TODO, incluyendo superusuarios)

Si en algún momento deseas reiniciar la base de datos a cero absoluto (como si la recién acabaras de crear) y volver a crear tu usuario administrador después, usa:

```bash
# 1. Vacía toda la base de datos (te pedirá confirmación con 'yes')
docker compose exec backend python manage.py flush

# 2. Crea un superusuario nuevo
docker compose exec backend python manage.py createsuperuser
```
