from django.db import models
from django.utils.translation import gettext_lazy as _

class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, help_text="e.g. Utensils, Drumstick")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = _('categoría')
        verbose_name_plural = _('categorías')
        
    def __str__(self):
        return self.name

class Subcategory(models.Model):
    category = models.ForeignKey(Category, related_name='subcategories', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _('subcategoría')
        verbose_name_plural = _('subcategorías')
        
    def __str__(self):
        return f"{self.category.name} - {self.name}"

class ProductStatus(models.TextChoices):
    AVAILABLE = 'Disponible', _('Disponible')
    OUT_OF_STOCK = 'Agotado', _('Agotado')

class Product(models.Model):
    subcategory = models.ForeignKey(Subcategory, related_name='items', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.AVAILABLE
    )

    class Meta:
        verbose_name = _('producto')
        verbose_name_plural = _('productos')
        
    def __str__(self):
        return self.name

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, help_text="e.g. Grande, Mediana, Sin Cebolla")
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Precio específico si aplica")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _('variante de producto')
        verbose_name_plural = _('variantes de producto')
        
    def __str__(self):
        return f"{self.product.name} - {self.name}"
