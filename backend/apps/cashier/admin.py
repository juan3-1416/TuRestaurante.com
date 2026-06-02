from django.contrib import admin
from apps.cashier.infrastructure.models import CashShift, Transaction

class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0

@admin.register(CashShift)
class CashShiftAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'initial_balance', 'final_balance', 'is_open', 'start_time')
    list_filter = ('is_open', 'start_time')
    inlines = [TransactionInline]

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'shift', 'transaction_type', 'amount', 'payment_method', 'created_at')
    list_filter = ('transaction_type', 'payment_method', 'created_at')
