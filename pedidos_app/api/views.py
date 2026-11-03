from django.db.models.deletion import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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


class ProtectedDeleteModelViewSet(viewsets.ModelViewSet):
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {'detail': 'No se puede eliminar: el registro tiene historial relacionado.'},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClienteViewSet(ProtectedDeleteModelViewSet):
    queryset = Cliente.objects.all().order_by('id')
    serializer_class = ClienteSerializer


class IngredienteViewSet(ProtectedDeleteModelViewSet):
    queryset = Ingrediente.objects.all().order_by('id')
    serializer_class = IngredienteSerializer


class PizzaViewSet(ProtectedDeleteModelViewSet):
    queryset = Pizza.objects.prefetch_related('ingredientes').all()
    serializer_class = PizzaSerializer


class PedidoViewSet(ProtectedDeleteModelViewSet):
    queryset = Pedido.objects.select_related('cliente', 'pizza').prefetch_related('detalles__pizza').all()
    serializer_class = PedidoSerializer


class PagoViewSet(ProtectedDeleteModelViewSet):
    queryset = Pago.objects.select_related('pedido').all()
    serializer_class = PagoSerializer


class RecomendacionViewSet(ProtectedDeleteModelViewSet):
    queryset = RecomendacionIA.objects.select_related(
        'cliente', 'pizza_recomendada'
    ).all()
    serializer_class = RecomendacionSerializer

    @action(detail=False, methods=['get'], url_path='sugerir')
    def sugerir(self, request):
        """Recomendador local basado en historial; no envía datos a servicios externos."""
        from collections import Counter
        from pedidos_app.models import DetallePedido

        cliente_id = request.query_params.get('cliente')
        if not cliente_id or not Cliente.objects.filter(pk=cliente_id).exists():
            return Response({'detail': 'Indica un cliente válido en ?cliente=ID.'}, status=400)

        lineas = DetallePedido.objects.filter(pedido__cliente_id=cliente_id).select_related('pizza')
        favoritos = Counter()
        for linea in lineas:
            favoritos.update(linea.pizza.ingredientes.values_list('id', flat=True))
        populares = Counter(DetallePedido.objects.values_list('pizza_id', flat=True))
        pizzas = list(Pizza.objects.prefetch_related('ingredientes').all())
        puntuadas = []
        for pizza in pizzas:
            coincidencias = sum(favoritos.get(ing.id, 0) for ing in pizza.ingredientes.all())
            puntuadas.append((pizza, coincidencias, populares.get(pizza.id, 0)))
        puntuadas.sort(key=lambda item: (item[1], item[2], item[0].nombre), reverse=True)
        return Response({
            'metodo': 'Recomendación local por ingredientes preferidos y popularidad; no usa un modelo generativo.',
            'recomendaciones': [
                {'pizza': pizza.id, 'nombre': pizza.nombre, 'precio': pizza.precio,
                 'motivo': (f'Coincide con {coincidencias} preferencia(s) de ingredientes.'
                            if coincidencias else 'Popularidad general del menú.')}
                for pizza, coincidencias, _ in puntuadas[:3]
            ],
        })
