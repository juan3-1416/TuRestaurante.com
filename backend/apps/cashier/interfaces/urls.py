from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.cashier.interfaces.views import CashierViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'shift', CashierViewSet, basename='shift')
router.register(r'transactions', TransactionViewSet, basename='transactions')

urlpatterns = [
    path('', include(router.urls)),
]
