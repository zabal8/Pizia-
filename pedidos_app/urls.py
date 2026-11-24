from django.contrib.auth.views import LoginView, LogoutView
from django.urls import path, reverse_lazy
from . import views
from .forms import IngresoClienteForm

urlpatterns = [

    # Sitio publico para clientes.
    path('', views.inicio, name='inicio'),
    path('pedido/confirmado/', views.pedido_publico_confirmado, name='pedido_publico_confirmado'),
    path('rastrear/', views.rastrear_pedido, name='rastrear_pedido'),
    path('recomendaciones-menu/', views.recomendaciones_menu, name='recomendaciones_menu'),
    path('cuenta/crear/', views.registro_cliente, name='registro_cliente'),
    path(
        'cuenta/ingresar/',
        LoginView.as_view(
            template_name='cuenta/iniciar_sesion.html',
            authentication_form=IngresoClienteForm,
            redirect_authenticated_user=True,
            next_page=reverse_lazy('inicio'),
        ),
        name='ingresar_cliente',
    ),
    path(
        'cuenta/salir/',
        LogoutView.as_view(next_page=reverse_lazy('inicio')),
        name='salir_cliente',
    ),

    # Gestion interna de clientes.
    path('clientes/', views.lista_clientes, name='lista_clientes'),

    path(
        'clientes/nuevo/',
        views.crear_cliente,
        name='crear_cliente'
    ),

    path(
        'clientes/editar/<int:pk>/',
        views.editar_cliente,
        name='editar_cliente'
    ),

    path(
        'clientes/eliminar/<int:pk>/',
        views.eliminar_cliente,
        name='eliminar_cliente'
    ),

    # INGREDIENTES

    path(
        'ingredientes/',
        views.lista_ingredientes,
        name='lista_ingredientes'
    ),

    path(
        'ingredientes/nuevo/',
        views.crear_ingrediente,
        name='crear_ingrediente'
    ),

    path(
        'ingredientes/editar/<int:pk>/',
        views.editar_ingrediente,
        name='editar_ingrediente'
    ),

    path(
        'ingredientes/eliminar/<int:pk>/',
        views.eliminar_ingrediente,
        name='eliminar_ingrediente'
    ),

    # PIZZAS

    path(
        'pizzas/',
        views.lista_pizzas,
        name='lista_pizzas'
    ),

    path(
        'pizzas/nuevo/',
        views.crear_pizza,
        name='crear_pizza'
    ),

    path(
        'pizzas/editar/<int:pk>/',
        views.editar_pizza,
        name='editar_pizza'
    ),

    path(
        'pizzas/eliminar/<int:pk>/',
        views.eliminar_pizza,
        name='eliminar_pizza'
    ),

    path('pedidos/', views.lista_pedidos, name='lista_pedidos'),
    path('pedidos/nuevo/', views.crear_pedido, name='crear_pedido'),
    path('pedidos/editar/<int:pk>/', views.editar_pedido, name='editar_pedido'),
    path('pedidos/eliminar/<int:pk>/', views.eliminar_pedido, name='eliminar_pedido'),
    path('pagos/', views.lista_pagos, name='lista_pagos'),
    path('pagos/nuevo/', views.crear_pago, name='crear_pago'),

]
