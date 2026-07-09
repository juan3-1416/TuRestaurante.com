from rest_framework import serializers
from apps.inventory.infrastructure.models import Category, Subcategory, Product

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'price',
            'status',
            'subcategory',
            'subcategory_name',
            'category_name',
        ]

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
