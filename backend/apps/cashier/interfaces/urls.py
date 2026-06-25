from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.cashier.interfaces.views import CashierViewSet, TransactionViewSet, ExchangeRateView

router = DefaultRouter()
router.register(r'shift', CashierViewSet, basename='shift')
router.register(r'transactions', TransactionViewSet, basename='transactions')

urlpatterns = [
    path('exchange-rate/', ExchangeRateView.as_view(), name='exchange-rate'),
    path('', include(router.urls)),
]
