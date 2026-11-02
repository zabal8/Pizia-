from django.contrib import admin

from .models import Cliente
from .models import Ingrediente
from .models import Pizza
from .models import Pedido
from .models import Pago
from .models import RecomendacionIA


admin.site.register(Cliente)
admin.site.register(Ingrediente)
admin.site.register(Pizza)
admin.site.register(Pedido)
admin.site.register(Pago)
admin.site.register(RecomendacionIA)