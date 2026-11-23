from django.db import transaction
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
        fields = [
            'id', 'cliente', 'pizza', 'pizza_ids', 'pizzas', 'total',
            'fecha', 'estado', 'metodo_pago_preferido',
        ]
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


class PedidoPublicoLineaSerializer(serializers.Serializer):
    pizza_id = serializers.IntegerField(min_value=1)
    cantidad = serializers.IntegerField(min_value=1, max_value=50, default=1)


class PedidoPublicoSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100, trim_whitespace=True)
    email = serializers.EmailField()
    pizzas = PedidoPublicoLineaSerializer(many=True, allow_empty=False)
    metodo_pago_preferido = serializers.ChoiceField(
        choices=Pedido.METODOS_PAGO_PREFERIDOS, default='efectivo'
    )

    def validate_nombre(self, value):
        if len(value) < 3:
            raise serializers.ValidationError(
                'El nombre debe tener al menos 3 caracteres.'
            )
        return value

    def validate_email(self, value):
        return value.strip().casefold()

    def validate_pizzas(self, value):
        pizzas_validas = []
        ids_vistos = set()
        for item in value:
            pizza_id = item['pizza_id']
            if pizza_id in ids_vistos:
                raise serializers.ValidationError(
                    'Cada pizza debe aparecer una sola vez; usa cantidad para indicar unidades.'
                )
            ids_vistos.add(pizza_id)
            pizzas_validas.append(item)

        pizzas = Pizza.objects.in_bulk(ids_vistos)
        faltantes = ids_vistos - pizzas.keys()
        if faltantes:
            raise serializers.ValidationError(
                f'No se encontraron las pizzas: {", ".join(map(str, sorted(faltantes)))}.'
            )
        return [
            {'pizza': pizzas[item['pizza_id']], 'cantidad': item['cantidad']}
            for item in pizzas_validas
        ]

    def create(self, validated_data):
        datos_cliente = {
            'nombre': validated_data['nombre'],
        }
        with transaction.atomic():
            cliente = Cliente.objects.filter(
                email__iexact=validated_data['email']
            ).first()
            creado = cliente is None
            if creado:
                cliente = Cliente.objects.create(
                    email=validated_data['email'], **datos_cliente
                )
            if not creado and cliente.nombre != datos_cliente['nombre']:
                cliente.nombre = datos_cliente['nombre']
                cliente.save(update_fields=['nombre'])

            lineas = validated_data['pizzas']
            pedido = Pedido.objects.create(
                cliente=cliente,
                pizza=lineas[0]['pizza'],
                metodo_pago_preferido=validated_data['metodo_pago_preferido'],
            )
            DetallePedido.objects.bulk_create([
                DetallePedido(
                    pedido=pedido,
                    pizza=linea['pizza'],
                    cantidad=linea['cantidad'],
                    precio_unitario=linea['pizza'].precio,
                )
                for linea in lineas
            ])
        return pedido


class SeguimientoPedidoSerializer(serializers.ModelSerializer):
    pizzas = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = ['id', 'fecha', 'estado', 'pizzas', 'total']

    def get_pizzas(self, obj):
        return [
            {
                'nombre': linea.pizza.nombre,
                'tamano': linea.pizza.tamano,
                'cantidad': linea.cantidad,
            }
            for linea in obj.detalles.select_related('pizza').all()
        ]

    def get_total(self, obj):
        return obj.total


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
