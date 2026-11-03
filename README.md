# PizIA

Sistema de gestion de pizzeria desarrollado con Django, Django REST Framework y PostgreSQL. La aplicacion incluye paginas web y una API REST bajo `/api/v1/`.

## Requisitos

- Python 3.12 o superior.
- PostgreSQL.
- Dependencias de Python incluidas en `requirements.txt`.

## Configurar el entorno local

Desde PowerShell, en la carpeta del proyecto:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edita `.env` con las credenciales de tu base PostgreSQL. No subas `.env` al repositorio.

Crea en PostgreSQL la base `pizia_db` y el usuario que especificaste en `.env`. Luego aplica las migraciones e inicia el servidor:

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Rutas

- Paginas web: `http://127.0.0.1:8000/`
- API: `http://127.0.0.1:8000/api/v1/`
- Administracion: `http://127.0.0.1:8000/admin/`
- Inicio de sesion para la API navegable: `http://127.0.0.1:8000/api-auth/login/`

La API requiere autenticacion. Incluye recursos para clientes, ingredientes, pizzas, pedidos, pagos y recomendaciones.

La pagina publica de clientes esta en `/`: muestra el menu, permite seleccionar sabor y tamaño, calcula el total y registra el pedido con nombre y correo. No requiere iniciar sesion. El pago se coordina fuera del sitio por ahora.

Las paginas internas de clientes, pizzas, ingredientes, pedidos y pagos requieren una cuenta de personal. Inicia sesion en `/admin/login/`; crea una cuenta con `python manage.py createsuperuser` si aun no tienes una.

Las pantallas de pedidos y pagos estan disponibles en `/pedidos/` y `/pagos/`. Cada pedido admite varias pizzas; el pago debe coincidir con la suma de sus detalles. Los pedidos historicos se convierten en lineas de detalle al aplicar la migracion.

## Pedidos con varias pizzas y recomendaciones

- En `/pedidos/nuevo/`, selecciona una o varias pizzas. Cada seleccion agrega una unidad; el modelo `DetallePedido` tambien guarda cantidad y precio unitario historico.
- La API acepta `pizza_ids: [1, 2]` al crear o actualizar pedidos y devuelve `pizzas` y `total`. Se conserva el campo `pizza` por compatibilidad con integraciones anteriores.
- La pagina publica ofrece recomendaciones en `GET /recomendaciones-menu/?pizza=ID` cuando el cliente selecciona una pizza. La API personaliza en `GET /api/v1/recomendaciones/sugerir/?cliente=ID` usando el historial del cliente.
- El recomendador ajusta TF-IDF sobre las recetas e identifica similitud coseno entre ingredientes con scikit-learn. Aprende del catálogo y del historial local; no envía datos personales a servicios externos. No es un chat ni un modelo generativo.
- La migracion `0005_detallepedido_multi_pizza` conserva los pedidos existentes y crea una linea por pizza historica.
- Las pizzas del menu se ofrecen en cuatro tamaños: pequeña (precio mediano - $5.000), porción (mediano - $7.000), mediana (precio base) y grande (base + $10.000).
- La migracion `0006_pizza_tamano` agrega el tamaño y `0007_cargar_menu_pizzas` carga las diez recetas con sus ingredientes y precios. Ejecuta `python manage.py migrate` para actualizar la base.

## Revisiones

```powershell
python manage.py check
python manage.py test
```

## Estado del proyecto

Django y PostgreSQL son la arquitectura del proyecto. Se retiró el backend Node/SQLite obsoleto para dejar una sola implementación activa.

La carpeta `docs/` contiene el analisis inicial de requisitos, diseno, modelo de datos, plan de pruebas y guia de despliegue. Actualiza las evidencias y resultados con el equipo antes de la entrega.
