from django.shortcuts import render
from django.shortcuts import redirect
from django.shortcuts import get_object_or_404

from django.core.paginator import Paginator

from .models import Cliente
from .forms import ClienteForm


def inicio(request):
    return redirect('lista_clientes')


def lista_clientes(request):

    clientes = Cliente.objects.all()

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


def eliminar_cliente(request, pk):

    cliente = get_object_or_404(
        Cliente,
        pk=pk
    )

    if request.method == 'POST':

        cliente.delete()

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
from .models import Ingrediente
from .forms import IngredienteForm
def lista_ingredientes(request):

    ingredientes = Ingrediente.objects.all()

    return render(
        request,
        'ingredientes/lista.html',
        {
            'ingredientes': ingredientes
        }
    )


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
from .models import Pizza
from .forms import PizzaForm
def lista_pizzas(request):

    pizzas = Pizza.objects.all()

    return render(
        request,
        'pizzas/lista.html',
        {
            'pizzas': pizzas
        }
    )


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


def eliminar_pizza(request, pk):

    pizza = get_object_or_404(
        Pizza,
        pk=pk
    )

    if request.method == 'POST':

        pizza.delete()

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