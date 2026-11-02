from rest_framework import serializers

from pedidos_app.models import (
    Cliente,
    Ingrediente,
    Pago,
    Pedido,
    Pizza,
    RecomendacionIA,
)


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'email']


class IngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingrediente
        fields = ['id', 'nombre']


class PizzaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pizza
        fields = ['id', 'nombre', 'precio', 'ingredientes']


class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'pizza', 'fecha']
        read_only_fields = ['id', 'fecha']


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = ['id', 'pedido', 'monto', 'metodo', 'fecha_pago']
        read_only_fields = ['id', 'fecha_pago']


class RecomendacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecomendacionIA
        fields = [
            'id',
            'cliente',
            'pizza_recomendada',
            'motivo',
            'fecha',
        ]
        read_only_fields = ['id', 'fecha']
