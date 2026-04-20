from rest_framework import serializers
from apps.inventory.infrastructure.models import Category, Subcategory, Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'status', 'subcategory']

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
