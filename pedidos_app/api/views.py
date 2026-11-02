from rest_framework import viewsets

from pedidos_app.models import (
    Cliente,
    Ingrediente,
    Pago,
    Pedido,
    Pizza,
    RecomendacionIA,
)
from .serializers import (
    ClienteSerializer,
    IngredienteSerializer,
    PagoSerializer,
    PedidoSerializer,
    PizzaSerializer,
    RecomendacionSerializer,
)


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('id')
    serializer_class = ClienteSerializer


class IngredienteViewSet(viewsets.ModelViewSet):
    queryset = Ingrediente.objects.all().order_by('id')
    serializer_class = IngredienteSerializer


class PizzaViewSet(viewsets.ModelViewSet):
    queryset = Pizza.objects.prefetch_related('ingredientes').all()
    serializer_class = PizzaSerializer


class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.select_related('cliente', 'pizza').all()
    serializer_class = PedidoSerializer


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.select_related('pedido').all()
    serializer_class = PagoSerializer


class RecomendacionViewSet(viewsets.ModelViewSet):
    queryset = RecomendacionIA.objects.select_related(
        'cliente', 'pizza_recomendada'
    ).all()
    serializer_class = RecomendacionSerializer
