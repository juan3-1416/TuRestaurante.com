from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, SubcategoryViewSet, ProductViewSet, ProductVariantViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'subcategories', SubcategoryViewSet, basename='subcategories')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'variants', ProductVariantViewSet, basename='variants')

urlpatterns = [
    path('', include(router.urls)),
]
