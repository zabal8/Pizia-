from django.db import models
from decimal import Decimal


class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.nombre


class Ingrediente(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre


class Pizza(models.Model):
    TAMANOS = [
        ('pequena', 'Pequeña'),
        ('porcion', 'Porción'),
        ('mediana', 'Mediana'),
        ('grande', 'Grande'),
    ]

    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    tamano = models.CharField(max_length=10, choices=TAMANOS, default='mediana')

    ingredientes = models.ManyToManyField(
        Ingrediente,
        blank=True
    )

    def __str__(self):
        return f'{self.nombre} ({self.get_tamano_display()})'


class Pedido(models.Model):
    METODOS_PAGO_PREFERIDOS = [
        ('efectivo', 'Efectivo al recibir'),
        ('tarjeta', 'Tarjeta al recibir'),
        ('transferencia', 'Transferencia'),
    ]

    ESTADOS = [
        ('recibido', 'Recibido'),
        ('preparando', 'En preparación'),
        ('listo', 'Listo'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT
    )

    # Campo legado para conservar compatibilidad con pedidos existentes.
    pizza = models.ForeignKey(
        Pizza,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    fecha = models.DateTimeField(
        auto_now_add=True
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='recibido'
    )

    metodo_pago_preferido = models.CharField(
        max_length=20,
        choices=METODOS_PAGO_PREFERIDOS,
        default='efectivo',
    )

    def __str__(self):
        return f"Pedido #{self.id}"

    @property
    def total(self):
        lineas = list(self.detalles.select_related('pizza'))
        if lineas:
            return sum((linea.subtotal for linea in lineas), start=Decimal('0.00'))
        return self.pizza.precio if self.pizza_id else Decimal('0.00')


class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='detalles', on_delete=models.CASCADE)
    pizza = models.ForeignKey(Pizza, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['pedido', 'pizza'], name='pedido_pizza_unica')]

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad} x {self.pizza.nombre}"


class Pago(models.Model):
    pedido = models.OneToOneField(
        Pedido,
        on_delete=models.PROTECT
    )

    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    metodo = models.CharField(
        max_length=50
    )

    fecha_pago = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Pago #{self.id}"

class RecomendacionIA(models.Model):

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT
    )

    pizza_recomendada = models.ForeignKey(
        Pizza,
        on_delete=models.PROTECT
    )

    motivo = models.TextField()

    fecha = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.cliente} -> {self.pizza_recomendada}"
