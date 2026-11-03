from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos_app', '0007_cargar_menu_pizzas'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='metodo_pago_preferido',
            field=models.CharField(
                choices=[
                    ('efectivo', 'Efectivo al recibir'),
                    ('tarjeta', 'Tarjeta al recibir'),
                    ('transferencia', 'Transferencia'),
                ],
                default='efectivo',
                max_length=20,
            ),
        ),
    ]
