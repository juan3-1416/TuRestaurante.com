from django.contrib import admin
from apps.orders.infrastructure.models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'table', 'customer_name', 'status', 'total', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer_name', 'table__table_number')
    inlines = [OrderItemInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price')
    list_filter = ('order__status',)
