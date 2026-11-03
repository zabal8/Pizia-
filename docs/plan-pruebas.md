# Plan de pruebas

## Como ejecutar

Con el entorno virtual activo y PostgreSQL iniciado:

```powershell
python manage.py check
python manage.py test
```

Django crea una base de datos de pruebas separada. El usuario PostgreSQL configurado debe tener permiso para crearla.

## Casos automatizados

| ID | Caso | Resultado esperado |
|---|---|---|
| WEB-01 | Crear pedido desde formulario. | Redirecciona a la lista y guarda estado recibido. |
| WEB-02 | Cambiar estado del pedido. | Guarda el nuevo estado. |
| WEB-03 | Registrar pago con monto incorrecto. | Muestra validacion y no crea pago. |
| WEB-04 | Registrar pago con monto correcto. | Guarda un pago. |
| API-01 | Consultar API sin autenticacion. | Rechaza la solicitud. |
| API-02 | Crear cliente por API. | Responde 201 y persiste el cliente. |
| API-03 | Crear pizza con ingredientes por API. | Responde 201 y guarda la relacion. |
| API-04 | Actualizar estado de pedido por API. | Responde 200 y conserva el estado. |
| API-05 | Crear pago con monto incorrecto. | Responde 400 y no persiste el pago. |
| API-06 | Crear recomendacion por API. | Responde 201 y persiste el registro. |

## Resultados

Completar esta tabla despues de ejecutar las pruebas; no registrar resultados que no se hayan observado.

| Ejecucion | Fecha | Resultado | Evidencia |
|---|---|---|---|
| Pendiente | — | Pendiente de ejecucion en la maquina del equipo. | Guardar salida de terminal en Drive. |

## Pruebas manuales pendientes

- Probar la navegacion y formularios de clientes, pizzas, ingredientes, pedidos y pagos.
- Verificar que un pedido no acepte dos pagos.
- Probar IDs inexistentes y errores de validacion en la API.
- Verificar permisos de los roles antes del despliegue.
