from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from apps.cashier.infrastructure.models import CashShift, Transaction, TransactionType, PaymentMethod
from apps.cashier.interfaces.serializers import CashShiftSerializer, TransactionSerializer

class CashierViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def open_shift(self, request):
        user = request.user
        
        # Check if already open
        if CashShift.objects.filter(is_open=True).exists():
            return Response({'error': 'Ya existe un turno de caja abierto.'}, status=status.HTTP_400_BAD_REQUEST)
        
        initial_balance = request.data.get('initial_balance', 0)
        
        shift = CashShift.objects.create(
            user=user,
            initial_balance=initial_balance
        )
        serializer = CashShiftSerializer(shift)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def close_shift(self, request):
        shift = CashShift.objects.filter(is_open=True).first()
        if not shift:
            return Response({'error': 'No hay un turno de caja abierto.'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Calculate totals
            incomes = sum(t.amount for t in shift.transactions.filter(transaction_type=TransactionType.INCOME))
            expenses = sum(t.amount for t in shift.transactions.filter(transaction_type=TransactionType.EXPENSE))
            
            shift.total_income = incomes
            shift.total_expense = expenses
            shift.final_balance = shift.initial_balance + incomes - expenses
            shift.end_time = timezone.now()
            shift.is_open = False
            shift.save()
            
        serializer = CashShiftSerializer(shift)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def current(self, request):
        shift = CashShift.objects.filter(is_open=True).first()
        if not shift:
            return Response({'message': 'No open shift'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = CashShiftSerializer(shift)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = TransactionSerializer

    @action(detail=False, methods=['post'])
    def expense(self, request):
        shift = CashShift.objects.filter(is_open=True).first()
        if not shift:
            return Response({'error': 'No hay un turno de caja abierto para registrar gastos.'}, status=status.HTTP_400_BAD_REQUEST)
            
        amount = request.data.get('amount')
        description = request.data.get('description')
        
        if not amount or not description:
            return Response({'error': 'Se requiere amount y description.'}, status=status.HTTP_400_BAD_REQUEST)
            
        tx = Transaction.objects.create(
            shift=shift,
            transaction_type=TransactionType.EXPENSE,
            description=description,
            amount=amount,
            payment_method=PaymentMethod.CASH # Los gastos se asumen en efectivo por ahora
        )
        
        serializer = TransactionSerializer(tx)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
