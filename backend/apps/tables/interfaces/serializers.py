from rest_framework import serializers
from apps.tables.infrastructure.models import Table

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'table_number', 'capacity', 'status', 'pos_x', 'pos_y']
