import random
from datetime import timedelta, time, datetime
from django.utils import timezone
from django.core.management.base import BaseCommand

# Importamos todos los modelos
from apps.orders.infrastructure.models import Order, OrderItem, OrderStatus
from apps.tables.infrastructure.models import Table, TableStatus
from apps.inventory.infrastructure.models import Category, Subcategory, Product, ProductStatus
from apps.cashier.infrastructure.models import CashShift, Transaction, TransactionType, PaymentMethod
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Puebla toda la base de datos con datos COHERENTES y REALES para probar reportes a fondo'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Iniciando poblado de base de datos con datos realistas...'))

        # ==========================================
        # 1. CREAR USUARIOS (Cajeros y Meseros)
        # ==========================================
        self.stdout.write('Creando Usuarios...')
        User.objects.filter(is_superuser=False).delete() # Aseguramos limpiar usuarios no admin
        
        waiters = []
        cashiers = []
        nombres_meseros = ['Carlos Lopez', 'Maria Garcia', 'Juan Perez']
        nombres_cajeros = ['Ana Torres', 'Luis Fernandez']

        for nombre in nombres_meseros:
            first, last = nombre.split()
            user, _ = User.objects.get_or_create(username=first.lower(), defaults={'first_name': first, 'last_name': last, 'email': f"{first.lower()}@restaurante.com"})
            user.set_password('password123')
            user.save()
            waiters.append(user)
            
        for nombre in nombres_cajeros:
            first, last = nombre.split()
            user, _ = User.objects.get_or_create(username=first.lower(), defaults={'first_name': first, 'last_name': last, 'email': f"{first.lower()}@restaurante.com"})
            user.set_password('password123')
            user.save()
            cashiers.append(user)

        # ==========================================
        # 2. CREAR MENÚ COHERENTE (Datos reales de restaurante)
        # ==========================================
        self.stdout.write('Creando Menú Realista...')
        Category.objects.all().delete() # Limpiar menú anterior
        
        MENU_REALISTA = {
            "Bebidas": {
                "Gaseosas": [("Coca Cola 2L", 15.0), ("Sprite 500ml", 8.0), ("Fanta 2L", 14.0), ("Coca Cola Personal", 7.0)],
                "Cervezas": [("Paceña 1L", 25.0), ("Huari 1L", 28.0), ("Corona 330ml", 18.0)]
            },
            "Platos Principales": {
                "Carnes": [("Pique Macho Familiar", 90.0), ("Pique Macho Simple", 50.0), ("Lomo Borracho", 55.0), ("Churrasco", 75.0), ("Silpancho", 35.0)],
                "Pastas": [("Lasaña de Carne", 45.0), ("Espagueti a la Boloñesa", 40.0), ("Fettuccine Alfredo", 45.0)]
            },
            "Postres": {
                "Tortas": [("Porción Torta Tres Leches", 18.0), ("Porción Torta de Chocolate", 20.0), ("Cheesecake de Frutos Rojos", 22.0)],
                "Helados": [("Copa de Helado Simple", 12.0), ("Copa Mixta Especial", 18.0)]
            },
            "Entradas": {
                "Sopas": [("Sopa de Maní", 15.0), ("Chairo", 18.0)],
                "Piqueos": [("Porción de Papas Fritas", 15.0), ("Alitas BBQ (6 piezas)", 35.0), ("Nachos con Queso", 25.0)]
            }
        }

        products_list = []
        for cat_name, subcategorias in MENU_REALISTA.items():
            category = Category.objects.create(name=cat_name, icon='Restaurant')
            for sub_name, productos in subcategorias.items():
                subcategory = Subcategory.objects.create(category=category, name=sub_name)
                for prod_name, price in productos:
                    product = Product.objects.create(
                        subcategory=subcategory, name=prod_name, price=price, status=ProductStatus.AVAILABLE
                    )
                    products_list.append(product)

        # ==========================================
        # 3. CREAR MESAS
        # ==========================================
        self.stdout.write('Creando Mesas...')
        Table.objects.all().delete()
        tables_list = []
        for i in range(1, 13): # 12 Mesas
            table = Table.objects.create(table_number=str(i), capacity=random.choice([2, 4, 4, 6, 8]), status=TableStatus.FREE)
            tables_list.append(table)

        # ==========================================
        # 4. SIMULAR 2 AÑOS DE TURNOS DE CAJA Y PEDIDOS DIARIOS
        # ==========================================
        self.stdout.write(self.style.SUCCESS('Simulando turnos de caja, ingresos, egresos y pedidos diarios de los últimos 2 años...'))
        CashShift.objects.all().delete()
        Order.objects.all().delete()
        
        end_date = timezone.now().date()
        from datetime import date
        start_date = date(2025, 1, 1) # Desde el 1 de enero de 2025 hasta hoy
        
        gastos_comunes = ["Compra de verduras del mercado", "Pago proveedor de Coca Cola", "Artículos de limpieza", "Pago servicio de internet", "Mantenimiento de cocina", "Compra de carnes"]
        
        current_date = start_date
        total_orders_created = 0
        
        while current_date <= end_date:
            # 1. Abrir Turno de Caja a las 10:00 AM
            start_datetime = timezone.make_aware(datetime.combine(current_date, time(10, 0)))
            end_datetime = timezone.make_aware(datetime.combine(current_date, time(23, 0)))
            
            shift = CashShift.objects.create(
                user=random.choice(cashiers),
                initial_balance=random.choice([100.0, 200.0, 150.0]),
                is_open=False, # Lo cerraremos al final del día
            )
            # Truco para forzar fecha en auto_now_add
            CashShift.objects.filter(pk=shift.pk).update(start_time=start_datetime, end_time=end_datetime)
            
            shift_income = 0.0
            shift_expense = 0.0
            
            # 2. Registrar 1 Gasto aleatorio por día (No todos los días tienen gastos, 70% probabilidad)
            if random.random() < 0.70:
                amount_expense = round(random.uniform(50.0, 300.0), 2)
                expense_time = start_datetime + timedelta(minutes=random.randint(10, 60))
                txn_expense = Transaction.objects.create(
                    shift=shift,
                    transaction_type=TransactionType.EXPENSE,
                    description=random.choice(gastos_comunes),
                    amount=amount_expense,
                    payment_method=PaymentMethod.CASH,
                )
                Transaction.objects.filter(pk=txn_expense.pk).update(created_at=expense_time)
                shift_expense += amount_expense

            # 3. Generar entre 5 y 25 pedidos para este día
            num_orders = random.randint(5, 25)
            for _ in range(num_orders):
                order_time = start_datetime + timedelta(minutes=random.randint(30, 12 * 60)) # Hora aleatoria en el turno
                status = random.choices([OrderStatus.PAID, OrderStatus.CANCELLED], weights=[0.95, 0.05])[0] # 95% pagados, 5% cancelados
                
                order = Order.objects.create(
                    table=random.choice(tables_list),
                    waiter=random.choice(waiters),
                    customer_name="Cliente" if random.random() < 0.3 else "",
                    status=status,
                    observation_note="Sin llajua" if random.random() < 0.05 else "",
                )
                Order.objects.filter(pk=order.pk).update(created_at=order_time, updated_at=order_time)

                order_total = 0.0
                # Generar items para el pedido
                for _ in range(random.randint(1, 4)):
                    product = random.choice(products_list)
                    quantity = random.randint(1, 3)
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        price=product.price,
                        is_takeaway=random.choices([True, False], weights=[0.2, 0.8])[0]
                    )
                    order_total += float(product.price) * quantity
                
                Order.objects.filter(pk=order.pk).update(total=order_total)
                total_orders_created += 1

                # 4. Si el pedido fue PAGADO, entra dinero a la CAJA
                if status == OrderStatus.PAID:
                    txn_income = Transaction.objects.create(
                        shift=shift,
                        transaction_type=TransactionType.INCOME,
                        description=f"Pago Pedido #{order.id}",
                        amount=order_total,
                        payment_method=random.choices([PaymentMethod.CASH, PaymentMethod.QR, PaymentMethod.CARD], weights=[0.5, 0.3, 0.2])[0],
                    )
                    Transaction.objects.filter(pk=txn_income.pk).update(created_at=order_time)
                    shift_income += order_total

            # 5. Cerrar el turno de caja del día
            CashShift.objects.filter(pk=shift.pk).update(
                total_income=shift_income,
                total_expense=shift_expense,
                final_balance=float(shift.initial_balance) + shift_income - shift_expense,
            )
            
            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(f'¡Base de datos perfecta! Generados 2 años de turnos de caja, {total_orders_created} pedidos y un menú 100% realista.'))
