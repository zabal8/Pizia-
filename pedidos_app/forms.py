from django import forms
from .models import Cliente, DetallePedido, Ingrediente, Pago, Pedido, Pizza


class PedidoPublicoForm(forms.Form):
    nombre = forms.CharField(
        max_length=100,
        label='Tu nombre',
        widget=forms.TextInput(attrs={'class': 'form-control', 'autocomplete': 'name'}),
    )
    email = forms.EmailField(
        label='Correo electrónico',
        widget=forms.EmailInput(attrs={'class': 'form-control', 'autocomplete': 'email'}),
    )
    pizzas = forms.ModelMultipleChoiceField(
        queryset=Pizza.objects.none(),
        required=True,
        label='Elige tus pizzas',
        error_messages={'required': 'Selecciona al menos una pizza.'},
    )
    metodo_pago_preferido = forms.ChoiceField(
        label='Método de pago',
        choices=Pedido.METODOS_PAGO_PREFERIDOS,
        initial='efectivo',
        widget=forms.RadioSelect,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['pizzas'].queryset = Pizza.objects.prefetch_related(
            'ingredientes'
        ).order_by('nombre', 'tamano')

    def clean(self):
        cleaned_data = super().clean()
        cantidades = {}
        for pizza in cleaned_data.get('pizzas', []):
            try:
                cantidad = int(self.data.get(f'cantidad_{pizza.pk}', '1'))
            except (TypeError, ValueError):
                cantidad = 0
            if not 1 <= cantidad <= 20:
                self.add_error('pizzas', f'La cantidad de {pizza.nombre} debe estar entre 1 y 20.')
            else:
                cantidades[pizza.pk] = cantidad
        cleaned_data['cantidades'] = cantidades
        return cleaned_data


class RastrearPedidoForm(forms.Form):
    numero_pedido = forms.IntegerField(
        label='Número de pedido',
        min_value=1,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej. 104'}),
    )
    email = forms.EmailField(
        label='Correo usado al pedir',
        widget=forms.EmailInput(attrs={'class': 'form-control', 'autocomplete': 'email'}),
    )


class ClienteForm(forms.ModelForm):

    class Meta:
        model = Cliente
        fields = "__all__"

    def clean_nombre(self):
        nombre = self.cleaned_data["nombre"]

        if len(nombre) < 3:
            raise forms.ValidationError(
                "El nombre debe tener mínimo 3 caracteres"
            )

        return nombre


class IngredienteForm(forms.ModelForm):

    class Meta:
        model = Ingrediente
        fields = "__all__"


class PizzaForm(forms.ModelForm):

    class Meta:
        model = Pizza
        fields = "__all__"


class PedidoForm(forms.ModelForm):
    pizzas = forms.ModelMultipleChoiceField(
        queryset=Pizza.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        label='Pizzas del pedido',
        help_text='Selecciona una o más pizzas. Cada una se agrega con cantidad 1.',
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'estado']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Compatibilidad con formularios e integraciones anteriores que envían `pizza`.
        if self.is_bound and not self.data.getlist('pizzas') and self.data.get('pizza'):
            datos = self.data.copy()
            datos.setlist('pizzas', [datos['pizza']])
            self.data = datos
        if self.instance.pk:
            actuales = self.instance.detalles.values_list('pizza_id', flat=True)
            self.fields['pizzas'].initial = list(actuales) or ([self.instance.pizza_id] if self.instance.pizza_id else [])

    def save(self, commit=True):
        pedido = super().save(commit=commit)
        if commit:
            seleccionadas = list(self.cleaned_data['pizzas'])
            pedido.detalles.all().delete()
            for pizza in seleccionadas:
                DetallePedido.objects.create(
                    pedido=pedido, pizza=pizza, cantidad=1, precio_unitario=pizza.precio
                )
            pedido.pizza = seleccionadas[0] if seleccionadas else None
            pedido.save(update_fields=['pizza'])
        return pedido


class PagoForm(forms.ModelForm):
    METODOS = [
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
        ('transferencia', 'Transferencia'),
    ]

    metodo = forms.ChoiceField(choices=METODOS)

    class Meta:
        model = Pago
        fields = ['pedido', 'monto', 'metodo']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        pedidos_pagados = Pago.objects.values_list('pedido_id', flat=True)
        self.fields['pedido'].queryset = Pedido.objects.exclude(
            id__in=pedidos_pagados
        ).select_related('cliente', 'pizza')

    def clean(self):
        cleaned_data = super().clean()
        pedido = cleaned_data.get('pedido')
        monto = cleaned_data.get('monto')

        if pedido and monto is not None and monto != pedido.total:
            self.add_error(
                'monto',
                'El monto debe coincidir con el total del pedido.'
            )

        return cleaned_data
