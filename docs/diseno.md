# Diseno del sistema PizIA

## Arquitectura

La arquitectura objetivo usa una sola aplicacion Django para las paginas HTML y la API REST. Django REST Framework publica operaciones JSON; Django ORM persiste los datos en PostgreSQL.

```text
Cliente en navegador / personal / cliente API
        |
        v
Sitio publico y gestion Django, mas API REST (/api/v1/)
        |
        v
Modelos y validaciones de pedidos_app
        |
        v
PostgreSQL
```

El backend Node/SQLite antiguo fue retirado; Django/PostgreSQL es la implementación activa.

## Componentes

- `pizia/settings.py`: configuracion Django, variables de entorno, PostgreSQL y permisos DRF.
- `pedidos_app/models.py`: entidades y relaciones.
- `pedidos_app/views.py`: flujos HTML.
- `pedidos_app/recomendador.py`: modelo TF-IDF y ranking de similitud coseno para recomendaciones locales.
- `pedidos_app/api/`: serializadores, viewsets y rutas REST.
- `templates/base_public.html` y `templates/publico/`: sitio público y captura de pedidos.
- `templates/base.html`: interfaz interna de gestión.

## Rutas principales

| Recurso | Coleccion | Elemento |
|---|---|---|
| Clientes | `/api/v1/clientes/` | `/api/v1/clientes/{id}/` |
| Ingredientes | `/api/v1/ingredientes/` | `/api/v1/ingredientes/{id}/` |
| Pizzas | `/api/v1/pizzas/` | `/api/v1/pizzas/{id}/` |
| Pedidos | `/api/v1/pedidos/` | `/api/v1/pedidos/{id}/` |
| Pagos | `/api/v1/pagos/` | `/api/v1/pagos/{id}/` |
| Recomendaciones | `/api/v1/recomendaciones/` | `/api/v1/recomendaciones/{id}/` |

La API usa sesiones y autenticacion basica de DRF con permiso `IsAdminUser`. Las paginas de gestion usan `staff_member_required` y envian a `/admin/login/`. Administradores y personal comparten permisos; separar capacidades por grupos sigue pendiente.
