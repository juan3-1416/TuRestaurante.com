from django.db import models
from django.utils.translation import gettext_lazy as _

class TableStatus(models.TextChoices):
    FREE = 'Libre', _('Libre')
    OCCUPIED = 'Ocupada', _('Ocupada')
    RESERVED = 'Reservada', _('Reservada')

class Table(models.Model):
    table_number = models.CharField(max_length=20, unique=True)
    capacity = models.PositiveIntegerField(default=4)
    status = models.CharField(
        max_length=20,
        choices=TableStatus.choices,
        default=TableStatus.FREE
    )
    # Coordenadas opcionales para la vista de Mapa de Mesas
    pos_x = models.FloatField(default=0.0, help_text="X position in the map")
    pos_y = models.FloatField(default=0.0, help_text="Y position in the map")

    class Meta:
        verbose_name = _('mesa')
        verbose_name_plural = _('mesas')
        
    def __str__(self):
        return f"Mesa {self.table_number}"
