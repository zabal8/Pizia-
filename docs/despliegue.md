# Despliegue

## Configuracion

El despliegue requiere una plataforma que ejecute Django y una base PostgreSQL accesible desde la aplicacion. Mantener los valores secretos como variables de entorno; nunca subir `.env`.

Variables requeridas:

```text
SECRET_KEY
DEBUG=False
ALLOWED_HOSTS
DB_NAME
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
```

## Preparacion

```powershell
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy
```

Configurar HTTPS, `ALLOWED_HOSTS`, una clave secreta nueva y un servidor WSGI/ASGI adecuado a la plataforma elegida. No desplegar con el servidor de desarrollo `runserver`.

## Estado

Plataforma y URL de produccion: pendientes de elegir. Registrar aqui la URL, fecha, version desplegada, pasos de despliegue y evidencia de una operacion funcional una vez realizada.
