from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class RoleChoices(models.TextChoices):
    ADMIN = 'ADMIN', _('Administrador')
    CASHIER = 'CASHIER', _('Cajero')
    WAITER = 'WAITER', _('Mesero')

class User(AbstractUser):
    """
    Modelo de Usuario base para todo el restaurante.
    Se extiende de AbstractUser de Django para mantener la compatibilidad
    con todo el framework de autenticación nativo, agregando el Rol.
    """
    role = models.CharField(
        max_length=15,
        choices=RoleChoices.choices,
        default=RoleChoices.WAITER,
        help_text=_('Rol que define los permisos y la UI del empleado')
    )

    class Meta:
        verbose_name = _('usuario')
        verbose_name_plural = _('usuarios')

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"
