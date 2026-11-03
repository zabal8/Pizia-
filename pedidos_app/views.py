from django.shortcuts import render
from django.shortcuts import redirect
from django.shortcuts import get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models.deletion import ProtectedError

from django.core.paginator import Paginator

from .models import Cliente, Ingrediente, Pago, Pedido, Pizza
from .forms import ClienteForm, IngredienteForm, PagoForm, PedidoForm, PizzaForm


def inicio(request):
    return redirect('lista_clientes')


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
