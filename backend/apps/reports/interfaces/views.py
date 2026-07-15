from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from django.db.models.functions import TruncHour, TruncDay, TruncMonth, ExtractHour
from decimal import Decimal

from apps.orders.infrastructure.models import Order, OrderItem, OrderStatus
from apps.cashier.infrastructure.models import Transaction, TransactionType
from apps.users.infrastructure.models import EmployeeShift

class ReportsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'hoy')
        
        now = timezone.now()
        start_date = now
        
        if period == 'hoy':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'semana':
            start_date = now - timezone.timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'mes':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == 'año':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            
        end_date = now

        # Base querysets
        orders_paid = Order.objects.filter(status=OrderStatus.PAID, created_at__range=(start_date, end_date))
        orders_observed = Order.objects.filter(status=OrderStatus.OBSERVED, created_at__range=(start_date, end_date))
        transactions_income = Transaction.objects.filter(transaction_type=TransactionType.INCOME, created_at__range=(start_date, end_date))
        employee_shifts = EmployeeShift.objects.filter(start_time__gte=start_date, start_time__lte=end_date)
        
        # --- Summary ---
        ingresos_totales = transactions_income.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        tickets_generados = orders_paid.count()
        ticket_promedio = float(ingresos_totales) / tickets_generados if tickets_generados > 0 else 0
        mesas_atendidas = orders_paid.values('table').distinct().count()
        platillos_servidos = OrderItem.objects.filter(order__in=orders_paid).aggregate(total=Sum('quantity'))['total'] or 0
        fugas_reportadas = orders_observed.count()
        
        summary = {
            'ingresosTotales': float(ingresos_totales),
            'ticketsGenerados': tickets_generados,
            'ticketPromedio': ticket_promedio,
            'mesasAtendidas': mesas_atendidas,
            'platillosServidos': platillos_servidos,
            'fugasReportadas': fugas_reportadas,
        }
        
        # --- Ingresos ---
        ingresos = []
        if period == 'hoy':
            grouped_income = transactions_income.annotate(hour=TruncHour('created_at')).values('hour').annotate(ingreso=Sum('amount'), tickets=Count('id')).order_by('hour')
            for item in grouped_income:
                hour_label = item['hour'].strftime('%H:00')
                ingresos.append({'label': hour_label, 'ingreso': float(item['ingreso']), 'tickets': item['tickets']})
        elif period == 'semana' or period == 'mes':
            grouped_income = transactions_income.annotate(day=TruncDay('created_at')).values('day').annotate(ingreso=Sum('amount'), tickets=Count('id')).order_by('day')
            for item in grouped_income:
                day_label = item['day'].strftime('%d %b') if period == 'mes' else item['day'].strftime('%a')
                ingresos.append({'label': day_label, 'ingreso': float(item['ingreso']), 'tickets': item['tickets']})
        elif period == 'año':
            grouped_income = transactions_income.annotate(month=TruncMonth('created_at')).values('month').annotate(ingreso=Sum('amount'), tickets=Count('id')).order_by('month')
            for item in grouped_income:
                month_label = item['month'].strftime('%b')
                ingresos.append({'label': month_label, 'ingreso': float(item['ingreso']), 'tickets': item['tickets']})
                
        # --- Horas Pico ---
        horas_pico = []
        grouped_orders = orders_paid.annotate(hour=ExtractHour('created_at')).values('hour').annotate(ordenes=Count('id')).order_by('hour')
        for item in grouped_orders:
            horas_pico.append({'hora': f"{item['hour']:02d}:00", 'ordenes': item['ordenes']})
            
        # --- Top Productos ---
        top_productos = []
        from django.db.models import DecimalField, ExpressionWrapper
        grouped_products = OrderItem.objects.filter(order__in=orders_paid).values('product__name').annotate(
            quantity=Sum('quantity'), 
            total_income=Sum(ExpressionWrapper(F('price') * F('quantity'), output_field=DecimalField()))
        ).order_by('-quantity')[:10]
        
        for item in grouped_products:
            top_productos.append({
                'name': item['product__name'],
                'quantity': item['quantity'],
                'total_income': float(item['total_income'])
            })
            
        # --- Métodos de Pago ---
        metodos_pago = []
        grouped_payments = transactions_income.values('payment_method').annotate(count=Count('id'), total=Sum('amount'))
        for item in grouped_payments:
            metodos_pago.append({
                'method': item['payment_method'],
                'count': item['count'],
                'total': float(item['total'])
            })
            
        # --- Empleados ---
        empleados = []
        # Agrupamos orders por waiter
        grouped_waiters = orders_paid.filter(waiter__isnull=False).values(
            'waiter__id', 'waiter__first_name', 'waiter__last_name', 'waiter__username', 'waiter__role'
        ).annotate(
            income=Sum('total'),
            tickets=Count('id'),
            tables=Count('table', distinct=True)
        )
        
        for item in grouped_waiters:
            waiter_id = item['waiter__id']
            name = f"{item['waiter__first_name']} {item['waiter__last_name']}".strip() or item['waiter__username']
            
            # Calcular horas trabajadas en el periodo
            waiter_shifts = employee_shifts.filter(user_id=waiter_id)
            total_seconds = 0
            for shift in waiter_shifts:
                end = shift.end_time or now
                total_seconds += (end - shift.start_time).total_seconds()
            
            hours = round(total_seconds / 3600, 1)
            
            empleados.append({
                'name': name,
                'role': item['waiter__role'],
                'income': float(item['income']),
                'tickets': item['tickets'],
                'tables': item['tables'],
                'hours': hours
            })
            
        return Response({
            'summary': summary,
            'ingresos': ingresos,
            'horasPico': horas_pico,
            'topProductos': top_productos,
            'metodosPago': metodos_pago,
            'empleados': empleados
        })
