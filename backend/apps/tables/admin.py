from django.contrib import admin
from apps.tables.infrastructure.models import Table

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('table_number', 'capacity', 'status', 'is_active')
    list_filter = ('status', 'is_active')
    search_fields = ('table_number',)
