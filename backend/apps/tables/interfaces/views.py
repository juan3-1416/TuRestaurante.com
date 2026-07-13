from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.tables.infrastructure.models import Table
from apps.orders.infrastructure.models import Order, OrderItem
from apps.inventory.infrastructure.models import Product
from .serializers import TableSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_table_update(table_id):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "restaurant_tables",
        {
            "type": "broadcast_update",
            "table_id": table_id
        }
    )

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

    def destroy(self, request, *args, **kwargs):
        table = self.get_object()
        table.is_active = False
        table.status = 'Libre'
        table.save()
        broadcast_table_update(table.id)
        return Response(status=204)

    def create(self, request, *args, **kwargs):
        table_number = request.data.get('table_number')
        if not table_number:
            return Response({'error': 'table_number is required'}, status=400)
            
        existing_table = Table.objects.filter(table_number=table_number).first()
        
        if existing_table:
            if existing_table.is_active:
                return Response({'error': 'La mesa ya existe.'}, status=400)
            else:
                # Reactivación automática
                existing_table.is_active = True
                capacity = request.data.get('capacity')
                if capacity:
                    existing_table.capacity = capacity
                existing_table.save()
                broadcast_table_update(existing_table.id)
                serializer = self.get_serializer(existing_table)
                return Response(serializer.data, status=200)
                
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            broadcast_table_update(response.data.get('id'))
        return response

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        table = self.get_object()
        data = request.data
        new_status = data.get('status')
        customer_name = data.get('customerName')
        active_time = data.get('activeTime')
        orders_data = data.get('orders')
        current_total = data.get('currentTotal')
        is_new_order = data.get('new_order', False)   # True → crear una Order nueva
        edit_order_id = data.get('order_id', None)    # ID numérico → editar esa Order específica
        order_note = data.get('note', '')              # Descripción del pedido (Mesa, Para Llevar, etc.)

        if not new_status:
            return Response({'error': 'El campo status es requerido'}, status=400)

        table.status = new_status
        table.save()

        if new_status in ['Ocupada', 'Reservada']:
            # --- Seleccionar o crear la Order a operar ---
            if is_new_order:
                # Nuevo pedido independiente → siempre crear una Order nueva
                order = Order.objects.create(table=table)
                order.waiter = request.user
            elif edit_order_id is not None:
                # Edición de una orden existente por su ID numérico
                order = table.orders.filter(id=edit_order_id).first()
                if not order:
                    return Response({'error': f'No se encontró la orden {edit_order_id} para esta mesa.'}, status=400)
            else:
                # Comportamiento clásico: reusar la primera orden pendiente
                order = table.orders.filter(status='Pendiente').first()
                if not order:
                    order = Order.objects.create(table=table)
                    order.waiter = request.user

            if customer_name is not None:
                order.customer_name = customer_name
            if active_time is not None:
                order.active_time = active_time
            if current_total is not None:
                order.total = current_total
            if order_note is not None:
                order.note = order_note
            order.save()

            if orders_data is not None:
                order.items.all().delete()
                product_counts = {}
                for prod in orders_data:
                    p_id = prod.get('id')
                    price = prod.get('price', 0)
                    is_takeaway = prod.get('isTakeaway', False)
                    key = f"{p_id}_{is_takeaway}"
                    if key not in product_counts:
                        product_counts[key] = {'p_id': p_id, 'qty': 0, 'price': price, 'is_takeaway': is_takeaway}
                    product_counts[key]['qty'] += 1

                new_total = 0
                for key, info in product_counts.items():
                    product = Product.objects.filter(id=info['p_id']).first()
                    if product:
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=info['qty'],
                            price=info['price'],
                            is_takeaway=info['is_takeaway']
                        )
                        new_total += float(info['price']) * info['qty']

                # Actualizar el total de la orden con el monto calculado
                order.total = new_total
                order.save()

        elif new_status == 'Libre':
            # Marcar TODAS las órdenes activas de la mesa como Pagadas o Canceladas
            active_orders = table.orders.filter(status__in=['Pendiente', 'Observada'])
            for order in active_orders:
                if order.total == 0:
                    order.status = 'Cancelada'
                else:
                    order.status = 'Pagada'
                order.save()

        if hasattr(table, '_active_orders'):
            delattr(table, '_active_orders')

        broadcast_table_update(table.id)
        return Response({'status': 'Estado actualizado', 'table': TableSerializer(table).data})

    @action(detail=True, methods=['patch'])
    def report_walkout(self, request, pk=None):
        table = self.get_object()
        note = request.data.get('note', 'Fuga reportada')
        
        order = table.orders.filter(status='Pendiente').first()
        if not order:
            return Response({'error': 'No hay orden pendiente en esta mesa.'}, status=400)
            
        table.status = 'Observada'
        table.save()
        
        order.status = 'Observada'
        order.observation_note = f"[{request.user.username}] {note}"
        order.save()
        
        broadcast_table_update(table.id)
        return Response({'status': 'Fuga reportada', 'table': TableSerializer(table).data})

    @action(detail=True, methods=['patch'])
    def resolve_walkout(self, request, pk=None):
        table = self.get_object()
        
        if table.status != 'Observada':
            return Response({'error': 'La mesa no esta observada.'}, status=400)
            
        order = table.orders.filter(status='Observada').first()
        
        table.status = 'Libre'
        table.save()
        
        if order:
            order.status = 'Cancelada'
            order.observation_note = (order.observation_note or '') + f" | Resuelto por {request.user.username}"
            order.save()
            
        broadcast_table_update(table.id)
        return Response({'status': 'Fuga resuelta', 'table': TableSerializer(table).data})

