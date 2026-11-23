# Estándar de Codificación PIZIA

## Lenguaje y framework

El backend utiliza Python, Django y Django REST Framework. PostgreSQL es la base de datos principal.

## Nomenclatura y estilo

- Usa nombres descriptivos en `snake_case` para variables y funciones, y `PascalCase` para clases.
- Sigue PEP 8 y las convenciones de Django.
- Mantén las validaciones de entrada en formularios o serializers; deja la lógica de negocio en funciones y servicios acotados.
- Separa modelos, vistas, serializers y rutas por aplicación y módulo.
- Usa transacciones para operaciones que guardan varias entidades relacionadas.
- Devuelve errores claros y códigos HTTP adecuados desde la API.
- Guarda secretos y configuración específica del entorno en variables de entorno; no subas archivos `.env`.

## Persistencia

Los datos se almacenan en PostgreSQL. Los cambios del esquema deben incluir migraciones de Django. No guardes precios enviados por el cliente como fuente de verdad: calcula los importes con datos del catálogo del servidor y persiste el precio unitario histórico en cada detalle del pedido.

## Mantenibilidad

Cada función debe tener una responsabilidad clara. Evita duplicación, lógica excesivamente extensa y comentarios que repiten literalmente el código. Añade pruebas para cambios de comportamiento y validaciones cuando se solicite verificar la implementación.
