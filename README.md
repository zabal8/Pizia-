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

La API de gestion requiere autenticacion de personal. Incluye recursos para clientes, ingredientes, pizzas, pedidos, pagos y recomendaciones. El menú público y las operaciones de pedido y seguimiento están disponibles sin iniciar sesión:

- `GET /api/v1/pizzas/menu/`: lista las pizzas del menú.
- `POST /api/v1/pedidos/publico/`: crea un pedido. Ejemplo: `{"nombre":"Ana Pérez","email":"ana@example.com","pizzas":[{"pizza_id":1,"cantidad":2}],"metodo_pago_preferido":"efectivo"}`. El servidor toma los precios vigentes del catálogo.
- `GET /api/v1/pedidos/seguimiento/?numero=1&email=ana%40example.com`: devuelve estado, líneas y total cuando el número y el correo coinciden.

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

## Publicar la aplicación

`runserver` es solo para desarrollo local. Para poner PizIA en Internet, despliega el código y una base PostgreSQL administrada en un proveedor de hosting. La configuración de producción acepta `DATABASE_URL`, sirve los estáticos con WhiteNoise y ejecuta Django mediante Gunicorn.

En Render, conecta este mismo repositorio y la rama `main`, crea un servicio web y una base Render PostgreSQL en la misma región, y configura:

- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Pre-deploy command: `python manage.py migrate`
- Start command: `gunicorn pizia.wsgi:application --bind 0.0.0.0:$PORT --workers 2`
- Variables de entorno: `DATABASE_URL` (URL interna de Render PostgreSQL), `SECRET_KEY` (valor secreto aleatorio), `DEBUG=False`.

Render proporciona el hostname del servicio en `RENDER_EXTERNAL_HOSTNAME`; Django lo incorpora a `ALLOWED_HOSTS` y `CSRF_TRUSTED_ORIGINS`. Si agregas un dominio propio, añade su origen HTTPS a `CSRF_TRUSTED_ORIGINS` y su host a `ALLOWED_HOSTS`.

Los servicios gratuitos de Render no permiten escalar instancias. El escalado manual requiere un plan de cómputo pagado y el autoescalado está disponible en espacios Pro o superiores. Selecciona el plan después de revisar el costo en el panel de Render. Consulta [la guía oficial para Django](https://render.com/docs/deploy-django) y [la guía de escalado](https://render.com/docs/scaling).

## Estado del proyecto

Django y PostgreSQL son la arquitectura del proyecto. Se retiró el backend Node/SQLite obsoleto para dejar una sola implementación activa.

La carpeta `docs/` contiene el analisis inicial de requisitos, diseno, modelo de datos, plan de pruebas y guia de despliegue. Actualiza las evidencias y resultados con el equipo antes de la entrega.
