from rest_framework.routers import DefaultRouter

from .views import (
    ClienteViewSet,
    IngredienteViewSet,
    PagoViewSet,
    PedidoViewSet,
    PizzaViewSet,
    RecomendacionViewSet,
)

router = DefaultRouter()
router.register('clientes', ClienteViewSet)
router.register('ingredientes', IngredienteViewSet)
router.register('pizzas', PizzaViewSet)
router.register('pedidos', PedidoViewSet)
router.register('pagos', PagoViewSet)
router.register('recomendaciones', RecomendacionViewSet)

urlpatterns = router.urls
