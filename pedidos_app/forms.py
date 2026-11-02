from django import forms
from .models import Cliente, Pizza, Ingrediente


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