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
        period = request.query_params.get('period', 'general')
        year_param = request.query_params.get('year')
        month_param = request.query_params.get('month')
        day_param = request.query_params.get('day')
        
        now = timezone.now()
        
        # Calculate start_date and end_date based on params
        if period == 'general':
            # Historical data
            first_order = Order.objects.order_by('created_at').first()
            if first_order:
                start_date = first_order.created_at
            else:
                start_date = now - timezone.timedelta(days=730)
            end_date = now
            
        elif period == 'hoy':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now
            
        elif period == 'ayer':
            start_date = (now - timezone.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date.replace(hour=23, minute=59, second=59)
            
        elif period == 'por_año':
            if year_param:
                year = int(year_param)
                start_date = now.replace(year=year, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(month=12, day=31, hour=23, minute=59, second=59)
            else:
                start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = now
                
        elif period == 'por_mes':
            if year_param and month_param:
                year = int(year_param)
                month = int(month_param)
                import calendar
                last_day = calendar.monthrange(year, month)[1]
                start_date = now.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(day=last_day, hour=23, minute=59, second=59)
            else:
                start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = now
                
        elif period == 'por_dia':
            if year_param and month_param and day_param:
                year = int(year_param)
                month = int(month_param)
                day = int(day_param)
                start_date = now.replace(year=year, month=month, day=day, hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59)
            else:
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = now
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
        tz = timezone.get_current_timezone()
        if period in ['hoy', 'ayer', 'por_dia']:
            grouped_income = transactions_income.annotate(hour=TruncHour('created_at', tzinfo=tz)).values('hour').annotate(ingreso=Sum('amount'), tickets=Count('id')).order_by('hour')
            for item in grouped_income:
                hour_label = item['hour'].astimezone(tz).strftime('%H:00')
                ingresos.append({'label': hour_label, 'ingreso': float(item['ingreso']), 'tickets': item['tickets']})
                
        elif period == 'por_mes':
            grouped_income = transactions_income.annotate(day=TruncDay('created_at', tzinfo=tz)).values('day').annotate(ingreso=Sum('amount'), tickets=Count('id')).order_by('day')
            for item in grouped_income:
                day_label = item['day'].astimezone(tz).strftime('%d %b')
                ingresos.append({'label': day_label, 'ingreso': float(item['ingreso']), 'tickets': item['tickets']})
                
        elif period in ['general', 'por_año']:
            grouped_income = transactions_income.annotate(month=TruncMonth('created_at', tzinfo=tz)).values('month').annotate(ingreso=Sum('amount'), tickets=Count('id')).order_by('month')
            for item in grouped_income:
                month_label = item['month'].astimezone(tz).strftime('%b %Y') if period == 'general' else item['month'].astimezone(tz).strftime('%b')
                ingresos.append({'label': month_label, 'ingreso': float(item['ingreso']), 'tickets': item['tickets']})
                
        # --- Horas Pico ---
        horas_pico = []
        tz = timezone.get_current_timezone()
        grouped_orders = orders_paid.annotate(hour=ExtractHour('created_at', tzinfo=tz)).values('hour').annotate(ordenes=Count('id')).order_by('hour')
        for item in grouped_orders:
            horas_pico.append({'hora': f"{item['hour']:02d}:00", 'ordenes': item['ordenes']})
            
        # --- Top Productos ---
        top_productos = []
        from django.db.models import DecimalField, ExpressionWrapper
        grouped_products = OrderItem.objects.filter(order__in=orders_paid).values('product__name').annotate(
            total_qty=Sum('quantity'), 
            total_income=Sum(ExpressionWrapper(F('price') * F('quantity'), output_field=DecimalField()))
        ).order_by('-total_qty')[:10]
        
        for item in grouped_products:
            top_productos.append({
                'name': item['product__name'],
                'quantity': item['total_qty'],
                'total_income': float(item['total_income'])
            })
            
        # --- Métodos de Pago ---
        metodos_pago = []
        grouped_payments = transactions_income.values('payment_method', 'currency').annotate(count=Count('id'), total=Sum('amount'))
        
        payment_dict = {}
        for item in grouped_payments:
            method_name = 'Dólares' if item['currency'] == 'USD' else item['payment_method']
            if method_name not in payment_dict:
                payment_dict[method_name] = {'count': 0, 'total': 0.0}
            payment_dict[method_name]['count'] += item['count']
            payment_dict[method_name]['total'] += float(item['total'])
            
        metodos_pago = [{'method': k, 'count': v['count'], 'total': v['total']} for k, v in payment_dict.items()]
            
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
            
            empleados.append({
                'name': name,
                'role': item['waiter__role'],
                'income': float(item['income']),
                'tickets': item['tickets'],
                'tables': item['tables']
            })
            
        return Response({
            'summary': summary,
            'ingresos': ingresos,
            'horasPico': horas_pico,
            'topProductos': top_productos,
            'metodosPago': metodos_pago,
            'empleados': empleados
        })
