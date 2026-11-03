from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Cliente, Ingrediente, Pago, Pedido, Pizza, RecomendacionIA


class PedidoYPagoWebTests(TestCase):
    def setUp(self):
        staff = get_user_model().objects.create_user(
            username='web-test-staff',
            password='test-password-123',
            is_staff=True,
        )
        self.client.force_login(staff)
        self.cliente = Cliente.objects.create(
            nombre='Ana Perez',
            email='ana@example.com',
        )
        self.pizza = Pizza.objects.create(
            nombre='Margarita',
            precio=Decimal('32000.00'),
        )

    def test_gestion_requiere_inicio_de_sesion_del_personal(self):
        self.client.logout()
        response = self.client.get(reverse('lista_pedidos'))
        self.assertEqual(response.status_code, 302)
        self.assertIn('/admin/login/', response.url)

    def test_crea_pedido_y_cambia_su_estado(self):
        response = self.client.post(
            reverse('crear_pedido'),
            {
                'cliente': self.cliente.id,
                'pizza': self.pizza.id,
                'estado': 'recibido',
            },
        )
        self.assertRedirects(response, reverse('lista_pedidos'))
        pedido = Pedido.objects.get()
        self.assertEqual(pedido.estado, 'recibido')

        response = self.client.post(
            reverse('editar_pedido', args=[pedido.id]),
            {
                'cliente': self.cliente.id,
                'pizza': self.pizza.id,
                'estado': 'preparando',
            },
        )
        self.assertRedirects(response, reverse('lista_pedidos'))
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'preparando')

    def test_pago_rechaza_monto_distinto_al_precio(self):
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            pizza=self.pizza,
        )
        response = self.client.post(
            reverse('crear_pago'),
            {
                'pedido': pedido.id,
                'monto': '1000.00',
                'metodo': 'efectivo',
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Pago.objects.exists())

    def test_pago_valido_se_guarda(self):
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            pizza=self.pizza,
        )
        response = self.client.post(
            reverse('crear_pago'),
            {
                'pedido': pedido.id,
                'monto': '32000.00',
                'metodo': 'efectivo',
            },
        )
        self.assertRedirects(response, reverse('lista_pagos'))
        self.assertEqual(Pago.objects.get().monto, Decimal('32000.00'))

    def test_no_elimina_pedido_con_pago(self):
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            pizza=self.pizza,
        )
        Pago.objects.create(
            pedido=pedido,
            monto=self.pizza.precio,
            metodo='efectivo',
        )
        response = self.client.post(
            reverse('eliminar_pedido', args=[pedido.id]),
        )
        self.assertEqual(response.status_code, 409)
        self.assertTrue(Pedido.objects.filter(pk=pedido.id).exists())
        self.assertTrue(Pago.objects.filter(pedido=pedido).exists())


class PiziaAPITests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='api-test-user',
            password='test-password-123',
            is_staff=True,
        )
        self.api = APIClient()
        self.api.force_authenticate(user=self.user)
        self.cliente = Cliente.objects.create(
            nombre='Luis Gomez',
            email='luis@example.com',
        )
        self.ingrediente = Ingrediente.objects.create(nombre='Albahaca')
        self.pizza = Pizza.objects.create(
            nombre='Napolitana',
            precio=Decimal('35000.00'),
        )

    def test_api_exige_autenticacion(self):
        response = APIClient().get('/api/v1/clientes/')
        self.assertIn(response.status_code, (401, 403))

    def test_api_requiere_usuario_de_personal(self):
        ordinary_user = get_user_model().objects.create_user(
            username='api-test-customer',
            password='test-password-123',
        )
        api = APIClient()
        api.force_authenticate(user=ordinary_user)
        response = api.get('/api/v1/clientes/')
        self.assertEqual(response.status_code, 403)

    def test_api_crea_cliente(self):
        response = self.api.post(
            '/api/v1/clientes/',
            {'nombre': 'Sofia Ruiz', 'email': 'sofia@example.com'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Cliente.objects.filter(email='sofia@example.com').exists())

    def test_api_crea_pizza_con_ingredientes(self):
        response = self.api.post(
            '/api/v1/pizzas/',
            {
                'nombre': 'Verde',
                'precio': '28000.00',
                'ingredientes': [self.ingrediente.id],
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        pizza_creada = Pizza.objects.get(nombre='Verde')
        self.assertEqual(list(pizza_creada.ingredientes.all()), [self.ingrediente])

    def test_api_actualiza_estado_de_pedido(self):
        pedido = Pedido.objects.create(cliente=self.cliente, pizza=self.pizza)
        response = self.api.patch(
            f'/api/v1/pedidos/{pedido.id}/',
            {'estado': 'listo'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'listo')

    def test_api_rechaza_pago_con_monto_incorrecto(self):
        pedido = Pedido.objects.create(cliente=self.cliente, pizza=self.pizza)
        response = self.api.post(
            '/api/v1/pagos/',
            {'pedido': pedido.id, 'monto': '1.00', 'metodo': 'efectivo'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Pago.objects.exists())

    def test_api_no_elimina_pizza_con_pedido(self):
        Pedido.objects.create(cliente=self.cliente, pizza=self.pizza)
        response = self.api.delete(f'/api/v1/pizzas/{self.pizza.id}/')
        self.assertEqual(response.status_code, 409)
        self.assertTrue(Pizza.objects.filter(pk=self.pizza.id).exists())

    def test_api_crea_recomendacion(self):
        response = self.api.post(
            '/api/v1/recomendaciones/',
            {
                'cliente': self.cliente.id,
                'pizza_recomendada': self.pizza.id,
                'motivo': 'Coincide con los ingredientes preferidos.',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(RecomendacionIA.objects.exists())
