from rest_framework import serializers

from pedidos_app.models import (
    Cliente,
    DetallePedido,
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

    def validate_nombre(self, value):
        nombre = value.strip()
        if len(nombre) < 3:
            raise serializers.ValidationError(
                'El nombre debe tener al menos 3 caracteres.'
            )
        return nombre


class IngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingrediente
        fields = ['id', 'nombre']

    def validate_nombre(self, value):
        nombre = value.strip()
        if not nombre:
            raise serializers.ValidationError('El nombre es obligatorio.')
        return nombre


class PizzaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pizza
        fields = ['id', 'nombre', 'tamano', 'precio', 'ingredientes']

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio debe ser mayor que cero.')
        return value


class PedidoSerializer(serializers.ModelSerializer):
    pizza_ids = serializers.PrimaryKeyRelatedField(
        queryset=Pizza.objects.all(), many=True, write_only=True, required=False
    )
    pizzas = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'pizza', 'pizza_ids', 'pizzas', 'total', 'fecha', 'estado']
        read_only_fields = ['id', 'fecha']

    def validate(self, attrs):
        if self.instance is None and not attrs.get('pizza_ids') and not attrs.get('pizza'):
            raise serializers.ValidationError({'pizza_ids': 'Selecciona al menos una pizza.'})
        return attrs

    def get_pizzas(self, obj):
        return [
            {'pizza': linea.pizza_id, 'nombre': linea.pizza.nombre,
             'cantidad': linea.cantidad, 'precio_unitario': linea.precio_unitario}
            for linea in obj.detalles.select_related('pizza').all()
        ]

    def get_total(self, obj):
        return obj.total

    def create(self, validated_data):
        pizzas = validated_data.pop('pizza_ids', None)
        pedido = super().create(validated_data)
        if pizzas is None:
            pizzas = [pedido.pizza] if pedido.pizza_id else []
        self._guardar_detalles(pedido, pizzas)
        return pedido

    def update(self, instance, validated_data):
        pizzas = validated_data.pop('pizza_ids', None)
        actualiza_pizza_legada = 'pizza' in validated_data
        pedido = super().update(instance, validated_data)
        if pizzas is None and actualiza_pizza_legada:
            pizzas = [pedido.pizza] if pedido.pizza_id else []
        if pizzas is not None:
            self._guardar_detalles(pedido, pizzas)
        return pedido

    @staticmethod
    def _guardar_detalles(pedido, pizzas):
        pedido.detalles.all().delete()
        for pizza in pizzas:
            DetallePedido.objects.create(
                pedido=pedido, pizza=pizza, cantidad=1, precio_unitario=pizza.precio
            )
        pedido.pizza = pizzas[0] if pizzas else None
        pedido.save(update_fields=['pizza'])


class PagoSerializer(serializers.ModelSerializer):
    metodo = serializers.ChoiceField(choices=[
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
        ('transferencia', 'Transferencia'),
    ])

    class Meta:
        model = Pago
        fields = ['id', 'pedido', 'monto', 'metodo', 'fecha_pago']
        read_only_fields = ['id', 'fecha_pago']

    def validate(self, attrs):
        pedido = attrs.get('pedido', getattr(self.instance, 'pedido', None))
        monto = attrs.get('monto', getattr(self.instance, 'monto', None))
        if pedido and monto is not None and monto != pedido.total:
            raise serializers.ValidationError({
                'monto': 'Debe coincidir con el total del pedido.'
            })
        return attrs


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
