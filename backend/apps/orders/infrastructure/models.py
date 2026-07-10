from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.tables.infrastructure.models import Table
from apps.inventory.infrastructure.models import Product
from django.conf import settings

class OrderStatus(models.TextChoices):
    PENDING = 'Pendiente', _('Pendiente')
    PAID = 'Pagada', _('Pagada')
    CANCELLED = 'Cancelada', _('Cancelada')
    OBSERVED = 'Observada', _('Observada')

class Order(models.Model):
    table = models.ForeignKey(Table, related_name='orders', on_delete=models.PROTECT)
    waiter = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    customer_name = models.CharField(max_length=150, blank=True, null=True)
    active_time = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    observation_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('orden')
        verbose_name_plural = _('órdenes')
        
    def __str__(self):
        return f"Order #{self.id} - Table {self.table.table_number}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_takeaway = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('item de orden')
        verbose_name_plural = _('items de orden')
        
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
