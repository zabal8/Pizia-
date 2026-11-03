from django.shortcuts import render
from django.shortcuts import redirect
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models.deletion import ProtectedError
from django.db.models import Sum
from django.db import transaction

from django.core.paginator import Paginator

from .models import Cliente, DetallePedido, Ingrediente, Pago, Pedido, Pizza
from .forms import (
    ClienteForm, IngredienteForm, PagoForm, PedidoForm, PedidoPublicoForm,
    PizzaForm, RastrearPedidoForm,
)
from .recomendador import recomendar_pizzas


def inicio(request):
    if request.method == 'POST':
        form = PedidoPublicoForm(request.POST)
        if form.is_valid():
            seleccionadas = list(form.cleaned_data['pizzas'])
            with transaction.atomic():
                cliente, _ = Cliente.objects.get_or_create(
                    email=form.cleaned_data['email'],
                    defaults={'nombre': form.cleaned_data['nombre']},
                )
                pedido = Pedido.objects.create(
                    cliente=cliente,
                    pizza=seleccionadas[0],
                    metodo_pago_preferido=form.cleaned_data['metodo_pago_preferido'],
                )
                DetallePedido.objects.bulk_create([
                    DetallePedido(
                        pedido=pedido,
                        pizza=pizza,
                        cantidad=form.cleaned_data['cantidades'][pizza.pk],
                        precio_unitario=pizza.precio,
                    )
                    for pizza in seleccionadas
                ])
            request.session['pedido_publico_id'] = pedido.pk
            return redirect('pedido_publico_confirmado')
    else:
        form = PedidoPublicoForm()

    pizzas = form.fields['pizzas'].queryset
    imagenes_menu = {
        'margarita': 'margarita',
        'pepperoni': 'pepperoni',
        'capricciosa': 'capricciosa',
        'mushroom': 'mushroom',
        'marinara': 'marinara',
        'seafood': 'seafood',
        'hawaiana': 'hawaiana',
        'vegetariana': 'vegetariana',
        'mexicana': 'mexicana',
        'carnes': 'carnes',
    }
    for pizza in pizzas:
        pizza.imagen_static = f"img/pizzas/{imagenes_menu.get(pizza.nombre.casefold(), 'margarita')}.jpg"
    selected_pizza_ids = {
        str(pizza_id) for pizza_id in (form['pizzas'].value() or [])
    } if form.is_bound else set()
    return render(request, 'publico/inicio.html', {
        'form': form,
        'pizzas': pizzas,
        'selected_pizza_ids': selected_pizza_ids,
    })


def pedido_publico_confirmado(request):
    pedido_id = request.session.pop('pedido_publico_id', None)
    if not pedido_id:
        return redirect('inicio')
    pedido = get_object_or_404(
        Pedido.objects.select_related('cliente').prefetch_related('detalles__pizza'),
        pk=pedido_id,
    )
    return render(request, 'publico/confirmacion.html', {'pedido': pedido})


def rastrear_pedido(request):
    form = RastrearPedidoForm(request.POST or None)
    pedido = None
    if request.method == 'POST' and form.is_valid():
        pedido = Pedido.objects.filter(
            pk=form.cleaned_data['numero_pedido'],
            cliente__email__iexact=form.cleaned_data['email'],
        ).select_related('cliente').prefetch_related('detalles__pizza').first()
        if pedido is None:
            form.add_error(None, 'No encontramos un pedido con ese número y correo.')
    return render(request, 'publico/rastrear.html', {'form': form, 'pedido': pedido})


def recomendaciones_menu(request):
    """Devuelve sugerencias ML para las pizzas seleccionadas en el menú público."""
    try:
        pizzas_fuente = [int(value) for value in request.GET.getlist('pizza')]
    except ValueError:
        return JsonResponse({'detail': 'Los IDs de pizza deben ser números.'}, status=400)
    if not pizzas_fuente:
        return JsonResponse({'detail': 'Selecciona al menos una pizza.'}, status=400)

    pizzas = list(Pizza.objects.prefetch_related('ingredientes').order_by('nombre', 'tamano'))
    ids_validos = {pizza.pk for pizza in pizzas}
    pizzas_fuente = [pizza_id for pizza_id in pizzas_fuente if pizza_id in ids_validos]
    if not pizzas_fuente:
        return JsonResponse({'detail': 'No se encontraron esas pizzas.'}, status=404)

    popularidad = {
        fila['pizza__nombre']: fila['total']
        for fila in DetallePedido.objects.values('pizza__nombre').annotate(total=Sum('cantidad'))
    }

    recomendaciones = recomendar_pizzas(
        pizzas,
        pizzas_fuente=pizzas_fuente,
        popularidad=popularidad,
    )
    return JsonResponse({
        'motor': 'TF-IDF y similitud coseno (scikit-learn)',
        'recomendaciones': recomendaciones,
    })


@staff_member_required
def lista_clientes(request):

    clientes = Cliente.objects.all().order_by('id')

    paginator = Paginator(clientes, 10)

    page = request.GET.get('page')

    clientes = paginator.get_page(page)

    return render(
        request,
        'clientes/lista.html',
        {
            'clientes': clientes
        }
    )


@staff_member_required
def crear_cliente(request):

    if request.method == 'POST':

        form = ClienteForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect('lista_clientes')

    else:

        form = ClienteForm()

    return render(
        request,
        'clientes/formulario.html',
        {
            'form': form
        }
    )


@staff_member_required
def editar_cliente(request, pk):

    cliente = get_object_or_404(
        Cliente,
        pk=pk
    )

    if request.method == 'POST':

        form = ClienteForm(
            request.POST,
            instance=cliente
        )

        if form.is_valid():

            form.save()

            return redirect(
                'lista_clientes'
            )

    else:

        form = ClienteForm(
            instance=cliente
        )

    return render(
        request,
        'clientes/formulario.html',
        {
            'form': form
        }
    )


@staff_member_required
def eliminar_cliente(request, pk):

    cliente = get_object_or_404(
        Cliente,
        pk=pk
    )

    if request.method == 'POST':
        try:
            cliente.delete()
        except ProtectedError:
            return render(
                request,
                'clientes/eliminar.html',
                {
                    'cliente': cliente,
                    'error': 'No se puede eliminar porque tiene pedidos o recomendaciones asociadas.'
                },
                status=409,
            )

        return redirect(
            'lista_clientes'
        )

    return render(
        request,
        'clientes/eliminar.html',
        {
            'cliente': cliente
        }
    )
@staff_member_required
def lista_ingredientes(request):

    ingredientes = Ingrediente.objects.all()

    return render(
        request,
        'ingredientes/lista.html',
        {
            'ingredientes': ingredientes
        }
    )


@staff_member_required
def crear_ingrediente(request):

    if request.method == 'POST':

        form = IngredienteForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect(
                'lista_ingredientes'
            )

    else:

        form = IngredienteForm()

    return render(
        request,
        'ingredientes/formulario.html',
        {
            'form': form
        }
    )


@staff_member_required
def editar_ingrediente(request, pk):

    ingrediente = get_object_or_404(
        Ingrediente,
        pk=pk
    )

    if request.method == 'POST':

        form = IngredienteForm(
            request.POST,
            instance=ingrediente
        )

        if form.is_valid():

            form.save()

            return redirect(
                'lista_ingredientes'
            )

    else:

        form = IngredienteForm(
            instance=ingrediente
        )

    return render(
        request,
        'ingredientes/formulario.html',
        {
            'form': form
        }
    )


@staff_member_required
def eliminar_ingrediente(request, pk):

    ingrediente = get_object_or_404(
        Ingrediente,
        pk=pk
    )

    if request.method == 'POST':

        ingrediente.delete()

        return redirect(
            'lista_ingredientes'
        )

    return render(
        request,
        'ingredientes/eliminar.html',
        {
            'ingrediente': ingrediente
        }
    )
@staff_member_required
def lista_pizzas(request):

    pizzas = Pizza.objects.all()

    return render(
        request,
        'pizzas/lista.html',
        {
            'pizzas': pizzas
        }
    )


@staff_member_required
def crear_pizza(request):

    if request.method == 'POST':

        form = PizzaForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect(
                'lista_pizzas'
            )

    else:

        form = PizzaForm()

    return render(
        request,
        'pizzas/formulario.html',
        {
            'form': form
        }
    )


@staff_member_required
def editar_pizza(request, pk):

    pizza = get_object_or_404(
        Pizza,
        pk=pk
    )

    if request.method == 'POST':

        form = PizzaForm(
            request.POST,
            instance=pizza
        )

        if form.is_valid():

            form.save()

            return redirect(
                'lista_pizzas'
            )

    else:

        form = PizzaForm(
            instance=pizza
        )

    return render(
        request,
        'pizzas/formulario.html',
        {
            'form': form
        }
    )


@staff_member_required
def eliminar_pizza(request, pk):

    pizza = get_object_or_404(
        Pizza,
        pk=pk
    )

    if request.method == 'POST':
        try:
            pizza.delete()
        except ProtectedError:
            return render(
                request,
                'pizzas/eliminar.html',
                {
                    'pizza': pizza,
                    'error': 'No se puede eliminar porque tiene pedidos o recomendaciones asociadas.'
                },
                status=409,
            )

        return redirect(
            'lista_pizzas'
        )

    return render(
        request,
        'pizzas/eliminar.html',
        {
            'pizza': pizza
        }
    )


@staff_member_required
def lista_pedidos(request):
    pedidos = Pedido.objects.select_related('cliente', 'pizza').prefetch_related('detalles__pizza').order_by('-fecha')
    return render(request, 'pedidos/lista.html', {'pedidos': pedidos})


@staff_member_required
def crear_pedido(request):
    form = PedidoForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        return redirect('lista_pedidos')
    return render(request, 'pedidos/formulario.html', {'form': form})


@staff_member_required
def editar_pedido(request, pk):
    pedido = get_object_or_404(Pedido, pk=pk)
    form = PedidoForm(request.POST or None, instance=pedido)
    if request.method == 'POST' and form.is_valid():
        form.save()
        return redirect('lista_pedidos')
    return render(request, 'pedidos/formulario.html', {'form': form})


@staff_member_required
def eliminar_pedido(request, pk):
    pedido = get_object_or_404(Pedido, pk=pk)
    if request.method == 'POST':
        try:
            pedido.delete()
        except ProtectedError:
            return render(
                request,
                'pedidos/eliminar.html',
                {
                    'pedido': pedido,
                    'error': 'No se puede eliminar un pedido que ya tiene un pago registrado.'
                },
                status=409,
            )
        return redirect('lista_pedidos')
    return render(request, 'pedidos/eliminar.html', {'pedido': pedido})


@staff_member_required
def lista_pagos(request):
    pagos = Pago.objects.select_related('pedido__cliente', 'pedido__pizza').prefetch_related('pedido__detalles__pizza')
    return render(request, 'pagos/lista.html', {'pagos': pagos})


@staff_member_required
def crear_pago(request):
    form = PagoForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        return redirect('lista_pagos')
    return render(request, 'pagos/formulario.html', {'form': form})
