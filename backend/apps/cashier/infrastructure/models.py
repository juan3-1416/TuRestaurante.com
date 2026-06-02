from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class CashShift(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='cash_shifts', on_delete=models.PROTECT)
    initial_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_open = models.BooleanField(default=True)
    
    total_income = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    total_expense = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    final_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = _('turno de caja')
        verbose_name_plural = _('turnos de caja')
        ordering = ['-start_time']

    def __str__(self):
        return f"Shift #{self.id} - {self.user.username} ({'Abierto' if self.is_open else 'Cerrado'})"


class TransactionType(models.TextChoices):
    INCOME = 'income', _('Ingreso')
    EXPENSE = 'expense', _('Egreso')

class PaymentMethod(models.TextChoices):
    CASH = 'Efectivo', _('Efectivo')
    QR = 'QR', _('QR')
    CARD = 'Tarjeta', _('Tarjeta')
    NA = 'N/A', _('N/A')

class Transaction(models.Model):
    shift = models.ForeignKey(CashShift, related_name='transactions', on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.NA)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('transacción')
        verbose_name_plural = _('transacciones')
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.transaction_type.upper()}] Bs. {self.amount} - {self.description}"
