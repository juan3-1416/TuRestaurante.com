from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from apps.users.infrastructure.models import User, RoleChoices

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'address', 'phone_number', 'bank_account_number']
        read_only_fields = ['id']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 'role', 'is_active', 'address', 'phone_number', 'bank_account_number']
        
    def create(self, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)

from apps.users.infrastructure.models import EmployeeShift

class EmployeeShiftSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField(read_only=True)
    generated_income = serializers.SerializerMethodField(read_only=True)
    tickets_generated = serializers.SerializerMethodField(read_only=True)
    tables_served = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EmployeeShift
        fields = ['id', 'user', 'username', 'full_name', 'start_time', 'end_time', 'is_active', 'observations', 'generated_income', 'tickets_generated', 'tables_served']
        read_only_fields = ['id', 'user', 'start_time']

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        
    def get_generated_income(self, obj):
        from apps.orders.infrastructure.models import Order
        orders = Order.objects.filter(
            waiter=obj.user,
            status='Pagada',
            updated_at__gte=obj.start_time
        )
        if obj.end_time:
            orders = orders.filter(updated_at__lte=obj.end_time)
            
        from django.db.models import Sum
        total = orders.aggregate(total=Sum('total'))['total']
        return float(total) if total else 0.0

    def get_tickets_generated(self, obj):
        from apps.orders.infrastructure.models import Order
        orders = Order.objects.filter(
            waiter=obj.user,
            created_at__gte=obj.start_time
        )
        if obj.end_time:
            orders = orders.filter(created_at__lte=obj.end_time)
        return orders.count()

    def get_tables_served(self, obj):
        from apps.orders.infrastructure.models import Order
        orders = Order.objects.filter(
            waiter=obj.user,
            created_at__gte=obj.start_time
        )
        if obj.end_time:
            orders = orders.filter(created_at__lte=obj.end_time)
        return orders.values('table').distinct().count()
