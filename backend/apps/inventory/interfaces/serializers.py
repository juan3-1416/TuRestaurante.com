from rest_framework import serializers
from apps.inventory.infrastructure.models import Category, Subcategory, Product, ProductVariant

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'price', 'is_active']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'status', 'subcategory', 'category_name', 'variants']

class SubcategorySerializer(serializers.ModelSerializer):
    items = ProductSerializer(many=True, read_only=True)
    
    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category', 'items']

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'subcategories']
