from django.db import models


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
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)

    ingredientes = models.ManyToManyField(
        Ingrediente,
        blank=True
    )

    def __str__(self):
        return self.nombre


class Pedido(models.Model):
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE
    )

    pizza = models.ForeignKey(
        Pizza,
        on_delete=models.CASCADE
    )

    fecha = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Pedido #{self.id}"


class Pago(models.Model):
    pedido = models.OneToOneField(
        Pedido,
        on_delete=models.CASCADE
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
        on_delete=models.CASCADE
    )

    pizza_recomendada = models.ForeignKey(
        Pizza,
        on_delete=models.CASCADE
    )

    motivo = models.TextField()

    fecha = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.cliente} -> {self.pizza_recomendada}"