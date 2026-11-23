from django.db.models.deletion import ProtectedError
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from pedidos_app.models import (
    Cliente,
    Ingrediente,
    Pago,
    Pedido,
    Pizza,
    RecomendacionIA,
    DetallePedido,
)
from pedidos_app.recomendador import recomendar_pizzas
from .serializers import (
    ClienteSerializer,
    IngredienteSerializer,
    PagoSerializer,
    PedidoSerializer,
    PedidoPublicoSerializer,
    PizzaSerializer,
    RecomendacionSerializer,
    SeguimientoPedidoSerializer,
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

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def menu(self, request):
        pizzas = self.get_queryset().order_by('nombre', 'tamano')
        return Response(self.get_serializer(pizzas, many=True).data)


class PedidoViewSet(ProtectedDeleteModelViewSet):
    queryset = Pedido.objects.select_related('cliente', 'pizza').prefetch_related('detalles__pizza').all()
    serializer_class = PedidoSerializer

    @action(
        detail=False,
        methods=['post'],
        url_path='publico',
        permission_classes=[AllowAny],
    )
    def crear_publico(self, request):
        serializer = PedidoPublicoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()
        return Response(
            SeguimientoPedidoSerializer(pedido).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=['get'],
        url_path='seguimiento',
        permission_classes=[AllowAny],
    )
    def seguimiento(self, request):
        numero = request.query_params.get('numero')
        email = request.query_params.get('email', '').strip()
        if not numero or not numero.isdecimal() or not email:
            return Response(
                {'detail': 'Indica el número de pedido y el correo usado al comprar.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pedido = self.get_queryset().filter(
            pk=numero,
            cliente__email__iexact=email,
        ).first()
        if pedido is None:
            return Response(
                {'detail': 'No encontramos un pedido con esos datos.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(SeguimientoPedidoSerializer(pedido).data)


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
        """Recomendador ML TF-IDF personalizado con las compras del cliente."""
        cliente_id = request.query_params.get('cliente')
        if not cliente_id or not Cliente.objects.filter(pk=cliente_id).exists():
            return Response({'detail': 'Indica un cliente válido en ?cliente=ID.'}, status=400)

        historial = list(DetallePedido.objects.filter(
            pedido__cliente_id=cliente_id
        ).select_related('pizza'))
        pizzas_fuente = [linea.pizza_id for linea in historial for _ in range(linea.cantidad)]
        populares = {
            fila['pizza__nombre']: fila['total']
            for fila in DetallePedido.objects.values('pizza__nombre').annotate(total=Sum('cantidad'))
        }
        pizzas = list(Pizza.objects.prefetch_related('ingredientes').all())
        recomendaciones = recomendar_pizzas(
            pizzas,
            pizzas_fuente=pizzas_fuente,
            popularidad=populares,
        )
        return Response({
            'motor': 'TF-IDF y similitud coseno (scikit-learn)',
            'personalizada': bool(pizzas_fuente),
            'recomendaciones': recomendaciones,
        })
