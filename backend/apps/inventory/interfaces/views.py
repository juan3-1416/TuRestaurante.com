from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminUserRole
from apps.inventory.infrastructure.models import Category, Subcategory, Product, ProductVariant
from .serializers import CategorySerializer, SubcategorySerializer, ProductSerializer, ProductVariantSerializer

from core.websocket import broadcast_global_action

class InventoryPermissionMixin:
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUserRole()]

class BroadcastMixin:
    broadcast_action_name = None

    def perform_create(self, serializer):
        super().perform_create(serializer)
        if self.broadcast_action_name:
            broadcast_global_action(self.broadcast_action_name)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        if self.broadcast_action_name:
            broadcast_global_action(self.broadcast_action_name)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        if self.broadcast_action_name:
            broadcast_global_action(self.broadcast_action_name)

class CategoryViewSet(InventoryPermissionMixin, BroadcastMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    broadcast_action_name = 'menu_updated'

class SubcategoryViewSet(InventoryPermissionMixin, BroadcastMixin, viewsets.ModelViewSet):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer
    broadcast_action_name = 'menu_updated'

class ProductViewSet(InventoryPermissionMixin, BroadcastMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    broadcast_action_name = 'inventory_updated'

class ProductVariantViewSet(InventoryPermissionMixin, BroadcastMixin, viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    broadcast_action_name = 'inventory_updated'

