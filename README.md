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

## Revisiones

```powershell
python manage.py check
python manage.py test
```

## Estado del proyecto

Django y PostgreSQL son la arquitectura objetivo. Los archivos del backend Node/SQLite siguen temporalmente en el repositorio como respaldo durante la migracion. No ejecutes su inicializador: actualmente elimina tablas al iniciar.

Antes de la entrega, documenta en `docs/` los requisitos, el diseno, el modelo de datos, el plan y resultados de pruebas, y el despliegue.
