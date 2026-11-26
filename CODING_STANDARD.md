# Estándar de codificación PizIA

## Lenguaje y arquitectura

- React y Vite para la interfaz; Node.js y Express para el servidor y la API.
- PostgreSQL es la base de datos principal. Usa consultas parametrizadas y transacciones en cambios relacionados.
- Mantén los componentes React en `src/` y los servicios del servidor en `server/`.

## Validación y seguridad

- Valida los datos recibidos en el servidor. Nunca confíes en el precio enviado por el navegador: obtén el precio desde el catálogo y conserva el precio unitario histórico en el detalle del pedido.
- Protege las rutas de gestión y API con autenticación de personal.
- Guarda secretos en variables de entorno; no subas `.env`.
- Devuelve mensajes y códigos HTTP adecuados, sin filtrar errores internos al cliente.

## Persistencia y compatibilidad

- Conserva las tablas actuales de PostgreSQL para que la migración no descarte los datos del sitio.
- Los cambios de esquema deben ser aditivos e idempotentes; no borres ni reinicies datos existentes.
- Usa transacciones para operaciones que escriben varias entidades.
