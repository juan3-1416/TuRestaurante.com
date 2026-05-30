from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.interfaces.views import OrderViewSet, OrderItemViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='order-item')

urlpatterns = [
    path('', include(router.urls)),
]
