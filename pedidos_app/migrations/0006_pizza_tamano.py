from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('pedidos_app', '0005_detallepedido_multi_pizza')]

    operations = [
        migrations.AddField(
            model_name='pizza',
            name='tamano',
            field=models.CharField(
                choices=[
                    ('pequena', 'Pequeña'),
                    ('porcion', 'Porción'),
                    ('mediana', 'Mediana'),
                    ('grande', 'Grande'),
                ],
                default='mediana',
                max_length=10,
            ),
        ),
    ]
