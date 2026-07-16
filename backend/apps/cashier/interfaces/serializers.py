from rest_framework import serializers
from apps.cashier.infrastructure.models import CashShift, Transaction

class TransactionSerializer(serializers.ModelSerializer):
    cashier_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = '__all__'

    def get_cashier_name(self, obj):
        user = obj.shift.user
        return f"{user.first_name} {user.last_name}".strip() or user.username

class CashShiftSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    cashier_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = CashShift
        fields = [
            'id', 'user', 'cashier_name', 'initial_balance', 'start_time', 
            'end_time', 'is_open', 'total_income', 'total_expense', 
            'final_balance', 'transactions'
        ]
        read_only_fields = ['user', 'start_time', 'end_time', 'total_income', 'total_expense', 'final_balance']
