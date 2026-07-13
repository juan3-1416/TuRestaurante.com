from rest_framework import serializers
from apps.tables.infrastructure.models import Table
from apps.orders.infrastructure.models import Order
from apps.inventory.interfaces.serializers import ProductSerializer
import uuid

class TableSerializer(serializers.ModelSerializer):
    number = serializers.CharField(source='table_number',required=False)
    customerName = serializers.SerializerMethodField()
    activeTime = serializers.SerializerMethodField()
    currentTotal = serializers.SerializerMethodField()
    activeOrderId = serializers.SerializerMethodField()
    orders = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ['id', 'number', 'capacity', 'status', 'pos_x', 'pos_y', 'customerName', 'activeTime', 'currentTotal', 'activeOrderId', 'orders']

    def get_active_order(self, obj):
        if not hasattr(obj, '_active_order'):
            obj._active_order = obj.orders.filter(status__in=['Pendiente', 'Observada']).first()
        return obj._active_order

    def get_customerName(self, obj):
        order = self.get_active_order(obj)
        return order.customer_name if order else None

    def get_activeTime(self, obj):
        order = self.get_active_order(obj)
        return order.active_time if order else None

    def get_currentTotal(self, obj):
        order = self.get_active_order(obj)
        return float(order.total) if order else 0.0

    def get_activeOrderId(self, obj):
        order = self.get_active_order(obj)
        return order.id if order else None

    def get_orders(self, obj):
        order = self.get_active_order(obj)
        if not order:
            return []
        items = order.items.select_related('product').all()
        products = []
        for item in items:
            for _ in range(item.quantity):
                product_data = ProductSerializer(item.product).data
                product_data['cartId'] = str(uuid.uuid4())
                product_data['price'] = float(item.price)
                product_data['isTakeaway'] = item.is_takeaway
                products.append(product_data)
        return products

