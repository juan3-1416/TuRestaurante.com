from rest_framework import serializers
from apps.orders.infrastructure.models import Order, OrderItem
from apps.inventory.interfaces.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'quantity', 'price']
        read_only_fields = ['price'] # Price is set from product at creation

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'table', 'table_number', 'customer_name', 'active_time', 'status', 'total', 'created_at', 'updated_at', 'items']
        read_only_fields = ['total', 'status']
