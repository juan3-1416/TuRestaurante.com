from rest_framework import serializers
from apps.tables.infrastructure.models import Table
from apps.orders.infrastructure.models import Order
from apps.inventory.interfaces.serializers import ProductSerializer
import uuid

class TableSerializer(serializers.ModelSerializer):
    number = serializers.CharField(source='table_number')
    customerName = serializers.SerializerMethodField()
    activeTime = serializers.SerializerMethodField()
    currentTotal = serializers.SerializerMethodField()
    activeOrderId = serializers.SerializerMethodField()
    activeOrderIds = serializers.SerializerMethodField()
    orders = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ['id', 'number', 'capacity', 'status', 'pos_x', 'pos_y', 'customerName', 'activeTime', 'currentTotal', 'activeOrderId', 'activeOrderIds', 'orders']

    def get_active_orders(self, obj):
        """Devuelve TODAS las órdenes activas (Pendiente u Observada) de la mesa."""
        if not hasattr(obj, '_active_orders'):
            obj._active_orders = list(obj.orders.filter(status__in=['Pendiente', 'Observada']).order_by('id'))
        return obj._active_orders

    def get_active_order(self, obj):
        """Devuelve la primera orden activa (compatibilidad con campos existentes)."""
        orders = self.get_active_orders(obj)
        return orders[0] if orders else None

    def get_customerName(self, obj):
        order = self.get_active_order(obj)
        return order.customer_name if order else None

    def get_activeTime(self, obj):
        order = self.get_active_order(obj)
        return order.active_time if order else None

    def get_currentTotal(self, obj):
        """Suma los totales de TODAS las órdenes activas."""
        active_orders = self.get_active_orders(obj)
        return float(sum(order.total for order in active_orders)) if active_orders else 0.0

    def get_activeOrderId(self, obj):
        """ID de la primera orden activa (compatibilidad)."""
        order = self.get_active_order(obj)
        return order.id if order else None

    def get_activeOrderIds(self, obj):
        """Lista de IDs de TODAS las órdenes activas de la mesa."""
        active_orders = self.get_active_orders(obj)
        return [order.id for order in active_orders]

    def get_orders(self, obj):
        """Devuelve los ítems de TODAS las órdenes activas, cada uno con su orderId y note."""
        active_orders = self.get_active_orders(obj)
        if not active_orders:
            return []
        products = []
        for order in active_orders:
            items = order.items.select_related('product').all()
            for item in items:
                for _ in range(item.quantity):
                    product_data = ProductSerializer(item.product).data
                    product_data['cartId'] = str(uuid.uuid4())
                    product_data['price'] = float(item.price)
                    product_data['isTakeaway'] = item.is_takeaway
                    product_data['orderId'] = order.id   # ID numérico real del backend
                    product_data['orderNote'] = order.note  # Descripción del pedido
                    products.append(product_data)
        return products


