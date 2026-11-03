# Analisis de requisitos PizIA

## Proposito

Apoyar la gestion de una pizzeria con registro de clientes, catalogo de pizzas e ingredientes, seguimiento de pedidos y registro de pagos.

## Actores

| Actor | Necesidad | Estado en la version actual |
|---|---|---|
| Administrador | Mantener clientes, pizzas, ingredientes y consultar la administracion. | Paginas web y panel Django disponibles. |
| Personal de pizzeria | Registrar pedidos, actualizar su estado y registrar pagos. | Paginas web agregadas para pedidos y pagos. |
| Cliente | Consultar el menu y enviar un pedido. | Portada publica con menu por tamaño y captura de pedidos; no requiere cuenta. |

La API y las paginas de gestion requieren una cuenta marcada como personal (`is_staff`). Todavia no hay permisos diferenciados entre administrador y personal; ambos tienen los mismos accesos de gestion.

## Requisitos funcionales

| ID | Requisito | Estado |
|---|---|---|
| RF-01 | Crear, consultar, editar y eliminar clientes. | Implementado en paginas; API CRUD disponible. |
| RF-02 | Gestionar ingredientes y asociarlos a pizzas. | Implementado en paginas y API. |
| RF-03 | Gestionar pizzas, precios e ingredientes. | Implementado en paginas y API. |
| RF-04 | Crear pedidos asociados a un cliente y una o mas pizzas. | Implementado con detalles de pedido y totales calculados. |
| RF-05 | Actualizar el estado del pedido. | Implementado: recibido, en preparacion, listo, entregado o cancelado. |
| RF-06 | Registrar un pago por pedido. | Implementado; valida que el monto coincida con el total del pedido. |
| RF-07 | Recomendar pizzas a un cliente. | Página pública y API usan TF-IDF y similitud coseno sobre ingredientes e historial local. |
| RF-08 | Proteger las operaciones de gestion. | API y paginas web requieren cuenta de personal; faltan permisos diferenciados por rol. |
| RF-09 | Permitir al cliente elegir varias pizzas, tamaño y cantidades y enviar su pedido. | Implementado en la portada pública; los pedidos quedan recibidos y el pago en línea no está habilitado. |

## Requisitos no funcionales

- Persistencia relacional en PostgreSQL.
- API REST JSON bajo `/api/v1/`.
- Validar datos antes de guardar, incluyendo correos, precios y montos de pago.
- Interfaz en español que conserve la identidad visual existente.
- Secretos de conexion cargados desde `.env`, excluido del repositorio.
- Antes de produccion, configurar HTTPS, `DEBUG=False`, `ALLOWED_HOSTS` y permisos diferenciados por rol.

## Limites conocidos

El modelo admite varias pizzas por pedido mediante detalles con cantidad y precio historico. El recomendador es local y basado en reglas; no usa un modelo generativo. Inventario y calculo de envio siguen fuera del alcance.
