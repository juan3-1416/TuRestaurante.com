# Plan de Implementación Backend — Sección Caja (Moneda y Tipo de Cambio)

> **Para:** Compañero de equipo (Backend Developer)  
> **Contexto:** El frontend ya está adaptado para recibir los nuevos campos. En cuanto implementes estos cambios, la conexión será automática sin tocar el frontend.  
> **Stack:** Django 6.0 + Django REST Framework 3.17

---

## ¿Qué hay que hacer?

Son **4 cambios** en el backend, ordenados por dependencia:

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `apps/cashier/infrastructure/models.py` | Agregar 3 nuevos campos al modelo `Transaction` |
| 2 | `apps/cashier/interfaces/serializers.py` | Incluir los nuevos campos en `TransactionSerializer` |
| 3 | `apps/orders/interfaces/views.py` | Guardar los campos de moneda al cobrar una orden |
| 4 | `apps/cashier/interfaces/views.py` + `urls.py` | Crear endpoint `GET /cashier/exchange-rate/` |

Después de todo: **correr la migración**.

---

## CAMBIO 1 — Modelo `Transaction` (agregar campos de moneda)

**Archivo:** `backend/apps/cashier/infrastructure/models.py`

Agregar los 3 campos nuevos al modelo `Transaction`, justo después de `payment_method`:

```python
# ESTADO ACTUAL del modelo Transaction (líneas 35-50):
class Transaction(models.Model):
    shift = models.ForeignKey(CashShift, related_name='transactions', on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.NA)
    created_at = models.DateTimeField(auto_now_add=True)
```

```python
# ESTADO NUEVO — reemplazar el modelo Transaction completo:
class Transaction(models.Model):
    shift = models.ForeignKey(CashShift, related_name='transactions', on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.NA)
    created_at = models.DateTimeField(auto_now_add=True)

    # ── Campos nuevos de moneda ─────────────────────────────────────────────
    class CurrencyType(models.TextChoices):
        BOB = 'BOB', _('Boliviano')
        USD = 'USD', _('Dólar')

    currency = models.CharField(
        max_length=3,
        choices=CurrencyType.choices,
        default=CurrencyType.BOB,
        help_text="Moneda en que se recibió el pago (BOB o USD)"
    )
    exchange_rate = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Tasa de cambio USD→BOB usada al momento del cobro"
    )
    amount_foreign = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Monto original en moneda extranjera (USD). Null si se pagó en BOB."
    )
    # ────────────────────────────────────────────────────────────────────────

    class Meta:
        verbose_name = _('transacción')
        verbose_name_plural = _('transacciones')
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.transaction_type.upper()}] Bs. {self.amount} - {self.description}"
```

> [!IMPORTANT]
> El inner class `CurrencyType` va **dentro** del modelo `Transaction`. Asegúrate de la indentación correcta.

---

## CAMBIO 2 — Serializer `TransactionSerializer` (incluir campos nuevos)

**Archivo:** `backend/apps/cashier/interfaces/serializers.py`

El serializer actual usa `fields = '__all__'`, lo que significa que **automáticamente incluirá los 3 campos nuevos** una vez que hagas la migración. No necesitas cambiar el serializer.

```python
# Sin cambios necesarios — '__all__' ya captura los nuevos campos automáticamente
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'   # ✅ incluirá currency, exchange_rate, amount_foreign automáticamente
```

> [!NOTE]
> Solo verifica que después de la migración, cuando llames a `GET /cashier/shift/current/`, las transacciones incluyan los campos `currency`, `exchange_rate` y `amount_foreign` en la respuesta.

---

## CAMBIO 3 — Vista `pay` en orders (guardar los campos de moneda)

**Archivo:** `backend/apps/orders/interfaces/views.py`

El frontend enviará estos datos en el `POST /orders/{id}/pay/`:
```json
{
    "payment_method": "Efectivo",
    "currency": "USD",
    "exchange_rate": 7.52,
    "amount_foreign": 10.00
}
```

Hay que extraer esos campos y guardarlos al crear la `Transaction`.

```python
# ESTADO ACTUAL del método pay (líneas 23-58):
@action(detail=True, methods=['post'])
def pay(self, request, pk=None):
    order = self.get_object()
    
    if order.status == OrderStatus.PAID:
        return Response({'error': 'La orden ya está pagada.'}, status=status.HTTP_400_BAD_REQUEST)
        
    payment_method_str = request.data.get('payment_method', 'Efectivo')
    
    try:
        payment_method = PaymentMethod(payment_method_str)
    except ValueError:
        return Response({'error': 'Método de pago inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    shift = CashShift.objects.filter(is_open=True).first()
    if not shift:
        return Response({'error': 'Debe abrir un turno de caja antes de cobrar.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        order.status = OrderStatus.PAID
        order.save()
        
        Transaction.objects.create(
            shift=shift,
            transaction_type=TransactionType.INCOME,
            description=f"Cobro Orden #{order.id} - Mesa {order.table.table_number}",
            amount=order.total,
            payment_method=payment_method
        )
        
    serializer = self.get_serializer(order)
    return Response(serializer.data, status=status.HTTP_200_OK)
```

```python
# ESTADO NUEVO — reemplazar el método pay completo:
@action(detail=True, methods=['post'])
def pay(self, request, pk=None):
    order = self.get_object()
    
    if order.status == OrderStatus.PAID:
        return Response({'error': 'La orden ya está pagada.'}, status=status.HTTP_400_BAD_REQUEST)
        
    payment_method_str = request.data.get('payment_method', 'Efectivo')
    
    # Validar el método de pago
    try:
        payment_method = PaymentMethod(payment_method_str)
    except ValueError:
        return Response({'error': 'Método de pago inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    # ── Extraer campos de moneda enviados por el frontend ──────────────────
    currency_str = request.data.get('currency', 'BOB')
    exchange_rate = request.data.get('exchange_rate', None)
    amount_foreign = request.data.get('amount_foreign', None)

    # Validar currency
    from apps.cashier.infrastructure.models import Transaction as CashTransaction
    valid_currencies = [c.value for c in CashTransaction.CurrencyType]
    if currency_str not in valid_currencies:
        currency_str = 'BOB'  # fallback seguro

    # Convertir a Decimal si vienen como string o float
    from decimal import Decimal, InvalidOperation
    try:
        exchange_rate = Decimal(str(exchange_rate)) if exchange_rate else None
        amount_foreign = Decimal(str(amount_foreign)) if amount_foreign else None
    except InvalidOperation:
        exchange_rate = None
        amount_foreign = None
    # ────────────────────────────────────────────────────────────────────────

    # Buscar turno abierto
    shift = CashShift.objects.filter(is_open=True).first()
    if not shift:
        return Response({'error': 'Debe abrir un turno de caja antes de cobrar.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Cambiar estado de la orden
        order.status = OrderStatus.PAID
        order.save()
        
        # Registrar ingreso en el turno de caja (con campos de moneda)
        Transaction.objects.create(
            shift=shift,
            transaction_type=TransactionType.INCOME,
            description=f"Cobro Orden #{order.id} - Mesa {order.table.table_number}",
            amount=order.total,
            payment_method=payment_method,
            currency=currency_str,
            exchange_rate=exchange_rate,
            amount_foreign=amount_foreign,
        )
        
    serializer = self.get_serializer(order)
    return Response(serializer.data, status=status.HTTP_200_OK)
```

---

## CAMBIO 4 — Nuevo endpoint `GET /cashier/exchange-rate/`

Este es el cambio más importante y nuevo. Necesita **2 sub-pasos**:

### 4a. Agregar la vista en `views.py`

**Archivo:** `backend/apps/cashier/interfaces/views.py`

Agrega este import al inicio del archivo:
```python
import requests  # Para consumir la API externa
from django.core.cache import cache  # Para cachear la tasa y no llamar la API en cada request
```

Luego agrega esta nueva clase **al final** del archivo `views.py` (después de `TransactionViewSet`):

```python
class ExchangeRateView(viewsets.ViewSet):
    """
    Endpoint para obtener la tasa de cambio USD → BOB.
    Usa la API gratuita de exchangerate-api.com con caché de 30 minutos.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def exchange_rate(self, request):
        """
        GET /cashier/exchange-rate/
        Retorna: { "USD_TO_BOB": float, "updated_at": str }
        """
        CACHE_KEY = 'usd_to_bob_rate'
        CACHE_TIMEOUT = 60 * 30  # 30 minutos

        # Intentar obtener del caché primero
        cached = cache.get(CACHE_KEY)
        if cached:
            return Response(cached, status=status.HTTP_200_OK)

        # Si no está en caché, consultar la API externa
        try:
            # API gratuita — no requiere key para BOB (boliviano)
            # Documentación: https://www.exchangerate-api.com/docs/free
            api_url = "https://api.exchangerate-api.com/v4/latest/USD"
            response = requests.get(api_url, timeout=5)
            response.raise_for_status()
            data = response.json()

            bob_rate = data['rates'].get('BOB')
            if not bob_rate:
                raise ValueError("BOB rate not found in API response")

            result = {
                "USD_TO_BOB": float(bob_rate),
                "updated_at": data.get('date', '')
            }

            # Guardar en caché
            cache.set(CACHE_KEY, result, CACHE_TIMEOUT)
            return Response(result, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            # Si la API tarda mucho, devolver tasa de respaldo
            fallback = {"USD_TO_BOB": 7.52, "updated_at": "fallback"}
            return Response(fallback, status=status.HTTP_200_OK)

        except Exception as e:
            # Cualquier otro error: devolver tasa de respaldo
            fallback = {"USD_TO_BOB": 7.52, "updated_at": "fallback"}
            return Response(fallback, status=status.HTTP_200_OK)
```

> [!NOTE]
> La API `https://api.exchangerate-api.com/v4/latest/USD` es **gratuita** y no requiere registro ni API key. Tiene un límite de 1500 peticiones/mes, pero como usamos caché de 30 minutos, no habrá problema.

### 4b. Registrar la ruta en `urls.py`

**Archivo:** `backend/apps/cashier/interfaces/urls.py`

```python
# ESTADO ACTUAL:
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.cashier.interfaces.views import CashierViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'shift', CashierViewSet, basename='shift')
router.register(r'transactions', TransactionViewSet, basename='transactions')

urlpatterns = [
    path('', include(router.urls)),
]
```

```python
# ESTADO NUEVO — agregar ExchangeRateView al router:
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.cashier.interfaces.views import CashierViewSet, TransactionViewSet, ExchangeRateView

router = DefaultRouter()
router.register(r'shift', CashierViewSet, basename='shift')
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'rate', ExchangeRateView, basename='rate')   # ← NUEVO

urlpatterns = [
    path('', include(router.urls)),
]
```

> [!IMPORTANT]
> El endpoint quedará disponible en: `GET /api/cashier/rate/exchange_rate/`  
> El frontend llama a `/cashier/exchange-rate/` — **verifica con el equipo de frontend si la ruta final coincide**, o ajusta el basename/prefix.

---

## CAMBIO 5 — Agregar `requests` a `requirements.txt`

El paquete `requests` no está en el `requirements.txt` actual. Hay que agregarlo:

**Archivo:** `backend/requirements.txt`

```
Django>=6.0,<6.1
djangorestframework>=3.17,<3.18
psycopg2-binary>=2.9.11,<3.0
djangorestframework-simplejwt>=5.5,<5.6
drf-spectacular>=0.29,<0.30
python-dotenv>=1.2,<1.3
django-cors-headers>=4.6,<4.7
requests>=2.32,<3.0    # ← AGREGAR ESTA LÍNEA
```

---

## CAMBIO 6 — Correr la migración

Después de modificar el modelo `Transaction`, ejecutar en el servidor:

```bash
# Desde el directorio backend/
python manage.py makemigrations cashier
python manage.py migrate
```

Si usas Docker:
```bash
docker-compose exec backend python manage.py makemigrations cashier
docker-compose exec backend python manage.py migrate
```

---

## Verificación Final

Después de los cambios, prueba estos endpoints con Postman o el Swagger en `/api/docs/`:

### 1. Verificar tipo de cambio
```
GET /api/cashier/rate/exchange_rate/
Authorization: Bearer {token}

Respuesta esperada:
{
    "USD_TO_BOB": 6.96,
    "updated_at": "2026-06-24"
}
```

### 2. Verificar que las transacciones incluyen los nuevos campos
```
GET /api/cashier/shift/current/
Authorization: Bearer {token}

Respuesta esperada (transactions[]):
[
    {
        "id": 1,
        "shift": 1,
        "transaction_type": "income",
        "description": "Cobro Orden #5 - Mesa 3",
        "amount": "85.00",
        "payment_method": "Efectivo",
        "created_at": "2026-06-24T14:30:00Z",
        "currency": "USD",
        "exchange_rate": "7.5200",
        "amount_foreign": "11.31"
    }
]
```

### 3. Verificar cobro con moneda
```
POST /api/orders/5/pay/
Authorization: Bearer {token}
Content-Type: application/json

{
    "payment_method": "Efectivo",
    "currency": "USD",
    "exchange_rate": 7.52,
    "amount_foreign": 11.31
}
```

---

## Resumen de Archivos a Modificar

| Archivo | Tipo de cambio |
|---------|----------------|
| `apps/cashier/infrastructure/models.py` | Agregar campos `currency`, `exchange_rate`, `amount_foreign` a `Transaction` |
| `apps/cashier/interfaces/serializers.py` | Sin cambios (usa `__all__` que incluye automáticamente) |
| `apps/orders/interfaces/views.py` | Extraer y guardar `currency`, `exchange_rate`, `amount_foreign` en el método `pay` |
| `apps/cashier/interfaces/views.py` | Agregar clase `ExchangeRateView` con endpoint `GET /exchange_rate/` |
| `apps/cashier/interfaces/urls.py` | Registrar `ExchangeRateView` en el router |
| `requirements.txt` | Agregar `requests>=2.32,<3.0` |

> [!CAUTION]
> No olvides correr `makemigrations` y `migrate` después de modificar el modelo. Si no lo haces, el servidor dará error al intentar guardar transacciones con los campos nuevos.
