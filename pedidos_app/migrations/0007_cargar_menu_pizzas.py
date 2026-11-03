from decimal import Decimal

from django.db import migrations


TAMANOS = {
    'pequena': Decimal('-5000'),
    'porcion': Decimal('-7000'),
    'mediana': Decimal('0'),
    'grande': Decimal('10000'),
}

MENU = {
    'Margarita': (Decimal('20000'), [
        'Salsa de tomate', 'Queso mozzarella', 'Albahaca', 'Queso parmesano',
    ]),
    'Pepperoni': (Decimal('22000'), [
        'Salsa de tomate', 'Queso mozzarella', 'Pepperoni',
    ]),
    'Capricciosa': (Decimal('27000'), [
        'Salsa de tomate', 'Queso mozzarella', 'Aceite de oliva', 'Alcachofas',
        'Champiñones', 'Jamón cocido', 'Aceitunas negras',
    ]),
    'Mushroom': (Decimal('23000'), [
        'Salsa de tomate', 'Queso mozzarella', 'Ajo', 'Champiñones',
        'Perejil', 'Albahaca', 'Queso parmesano',
    ]),
    'Marinara': (Decimal('26000'), [
        'Salsa de tomate', 'Ajo', 'Orégano seco',
    ]),
    'Seafood': (Decimal('30000'), [
        'Camarones o langostinos', 'Mejillones', 'Almejas', 'Calamar o pulpo',
        'Ajo', 'Perejil', 'Limón', 'Salsa de tomate', 'Queso mozzarella',
    ]),
    'Hawaiana': (Decimal('15000'), [
        'Piña', 'Jamón cocido', 'Salsa de tomate', 'Queso mozzarella',
    ]),
    'Vegetariana': (Decimal('19000'), [
        'Pimiento', 'Calabacín', 'Berenjena', 'Maíz dulce', 'Tomate cherry',
        'Rúcula', 'Salsa de tomate', 'Queso',
    ]),
    'Mexicana': (Decimal('35000'), [
        'Carne molida', 'Frijoles', 'Chile jalapeño', 'Cebolla', 'Maíz tierno',
        'Aguacate', 'Cilantro', 'Nachos', 'Salsa de tomate', 'Queso asadero',
    ]),
    'Carnes': (Decimal('24000'), [
        'Pepperoni', 'Tocineta', 'Jamón cocido', 'Carne', 'Pollo desmechado',
        'Salsa de tomate', 'Queso mozzarella',
    ]),
}


def cargar_menu(apps, schema_editor):
    Pizza = apps.get_model('pedidos_app', 'Pizza')
    Ingrediente = apps.get_model('pedidos_app', 'Ingrediente')
    db = schema_editor.connection.alias

    for nombre, (precio_mediano, nombres_ingredientes) in MENU.items():
        ingredientes = []
        for nombre_ingrediente in nombres_ingredientes:
            ingrediente = Ingrediente.objects.using(db).filter(
                nombre__iexact=nombre_ingrediente
            ).first()
            if ingrediente is None:
                ingrediente = Ingrediente.objects.using(db).create(
                    nombre=nombre_ingrediente
                )
            ingredientes.append(ingrediente)

        # Reutiliza el catálogo probado y conserva el historial de sus pedidos.
        aliases = [nombre]
        if nombre == 'Pepperoni':
            aliases.append('Pepperoni clásica')
        pizza_mediana = Pizza.objects.using(db).filter(
            nombre__in=aliases, tamano='mediana'
        ).order_by('id').first()

        for tamano, ajuste in TAMANOS.items():
            pizza = pizza_mediana if tamano == 'mediana' else None
            if pizza is None:
                pizza = Pizza.objects.using(db).filter(
                    nombre=nombre, tamano=tamano
                ).order_by('id').first()
            if pizza is None:
                pizza = Pizza.objects.using(db).create(
                    nombre=nombre,
                    tamano=tamano,
                    precio=precio_mediano + ajuste,
                )
            pizza.nombre = nombre
            pizza.tamano = tamano
            pizza.precio = precio_mediano + ajuste
            pizza.save(using=db, update_fields=['nombre', 'tamano', 'precio'])
            pizza.ingredientes.set(ingredientes)


class Migration(migrations.Migration):
    dependencies = [('pedidos_app', '0006_pizza_tamano')]

    operations = [
        migrations.RunPython(cargar_menu, migrations.RunPython.noop),
    ]
