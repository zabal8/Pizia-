from django.db import migrations, models
import django.db.models.deletion


def crear_detalles_historicos(apps, schema_editor):
    Pedido = apps.get_model('pedidos_app', 'Pedido')
    DetallePedido = apps.get_model('pedidos_app', 'DetallePedido')
    for pedido in Pedido.objects.exclude(pizza_id=None).iterator():
        DetallePedido.objects.get_or_create(
            pedido_id=pedido.pk,
            pizza_id=pedido.pizza_id,
            defaults={'cantidad': 1, 'precio_unitario': pedido.pizza.precio},
        )


class Migration(migrations.Migration):
    dependencies = [('pedidos_app', '0004_alter_pago_pedido_alter_pedido_cliente_and_more')]
    operations = [
        migrations.AlterField(
            model_name='pedido', name='pizza',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='pedidos_app.pizza'),
        ),
        migrations.CreateModel(
            name='DetallePedido',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.PositiveIntegerField(default=1)),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('pedido', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles', to='pedidos_app.pedido')),
                ('pizza', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='pedidos_app.pizza')),
            ],
        ),
        migrations.AddConstraint(
            model_name='detallepedido', constraint=models.UniqueConstraint(fields=('pedido', 'pizza'), name='pedido_pizza_unica'),
        ),
        migrations.RunPython(crear_detalles_historicos, migrations.RunPython.noop),
    ]
