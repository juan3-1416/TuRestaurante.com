from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from apps.orders.infrastructure.models import Order, OrderItem, OrderStatus
from apps.orders.interfaces.serializers import OrderSerializer, OrderItemSerializer
from apps.cashier.infrastructure.models import CashShift, Transaction, TransactionType, PaymentMethod

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    # Filter by status if provided in query params
    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        order = self.get_object()
        
        if order.status == OrderStatus.PAID:
            return Response({'error': 'La orden ya está pagada.'}, status=status.HTTP_400_BAD_REQUEST)
            
        payment_method_str = request.data.get('payment_method', 'Efectivo')
        
        # Validar el método de pago
        try:
            payment_method = PaymentMethod(payment_method_str)
        except ValueError:
            return Response({'error': 'Método de pago inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar turno abierto
        shift = CashShift.objects.filter(is_open=True).first()
        if not shift:
            return Response({'error': 'Debe abrir un turno de caja antes de cobrar.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Cambiar estado de la orden
            order.status = OrderStatus.PAID
            order.save()
            
            # Registrar ingreso en el turno de caja
            Transaction.objects.create(
                shift=shift,
                transaction_type=TransactionType.INCOME,
                description=f"Cobro Orden #{order.id} - Mesa {order.table.table_number}",
                amount=order.total,
                payment_method=payment_method
            )
            
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        # Establecer el precio actual del producto al crear el item
        serializer.save(price=product.price)
        
        # Actualizar total de la orden
        order = serializer.validated_data['order']
        order.total += (product.price * serializer.validated_data.get('quantity', 1))
        order.save()
