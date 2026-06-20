from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminUserRole
from apps.inventory.infrastructure.models import Category, Subcategory, Product, ProductVariant
from .serializers import CategorySerializer, SubcategorySerializer, ProductSerializer, ProductVariantSerializer

class InventoryPermissionMixin:
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUserRole()]

class CategoryViewSet(InventoryPermissionMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class SubcategoryViewSet(InventoryPermissionMixin, viewsets.ModelViewSet):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer

class ProductViewSet(InventoryPermissionMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductVariantViewSet(InventoryPermissionMixin, viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
