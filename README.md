# PizIA

Sitio web para pedir pizza artesanal. La interfaz está construida con React y Vite; el servidor y la API usan Node.js y Express. PostgreSQL conserva el menú, clientes, pedidos y pagos.

## Requisitos

- Node.js 20 o superior
- PostgreSQL

## Preparación local

1. Crea una base de datos PostgreSQL (puedes reutilizar la base de datos existente).
2. Copia `.env.example` como `.env` y configura `DATABASE_URL` o las variables `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT`.
3. Instala dependencias y arranca el sitio:

```bash
npm install
npm run dev
```

La API estará en `http://localhost:3000` y Vite servirá React en `http://localhost:5173`.

Para producción, ejecuta `npm run build` y luego `npm start`. Express servirá los archivos de `dist/` y la API en el mismo puerto.

## Compra

El cliente selecciona uno o más sabores, tamaño y cantidad; el total se calcula con los precios del catálogo. Puede pedir como invitado o crear cuenta. Los pagos son coordinados con el personal: el sitio no solicita datos bancarios ni cobra en línea. El correo y el número del pedido permiten consultar el estado.

## Cuentas y acceso interno

Las cuentas existentes permanecen en la tabla `auth_user`. El inicio de sesión de Node verifica las contraseñas Django `pbkdf2_sha256`, y las nuevas cuentas se guardan con ese formato, para conservar el acceso de clientes y personal. El personal con `is_staff` administra clientes, ingredientes, pizzas, pedidos y pagos en las rutas `/staff`, `/clientes`, `/ingredientes`, `/pizzas`, `/pedidos` y `/pagos`.

## Datos existentes

El servidor conserva los nombres de las tablas PostgreSQL ya usadas por el proyecto Django. Al iniciar, crea tablas que falten y completa columnas recientes sin eliminar tablas ni filas. Si la tabla del menú está vacía, carga el catálogo inicial de diez sabores y cuatro tamaños. Haz una copia de seguridad de la base antes de cualquier cambio de infraestructura.

La API conserva el prefijo `/api/v1/` para el menú, pedidos, clientes, ingredientes, pizzas, pagos y recomendaciones. Las rutas de gestión requieren una cuenta de personal.

## Despliegue

Define `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production` y el `PORT` proporcionado por la plataforma. Si PostgreSQL exige SSL, define `DATABASE_SSL=true`. Configura el despliegue para ejecutar `npm install`, `npm run build` y `npm start`.
