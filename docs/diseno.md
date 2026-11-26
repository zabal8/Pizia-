# Diseño del sistema PizIA

## Arquitectura

React y Vite entregan la experiencia pública y el panel de gestión. Express sirve la API JSON y el build web; PostgreSQL conserva los datos del negocio.

```text
Navegador React
      |
      v
API Node.js / Express (/api/v1/ y /auth)
      |
      v
PostgreSQL (tablas existentes de PizIA)
```

## Componentes

- `src/App.jsx`: navegación, compra, rastreo, cuentas y gestión interna.
- `src/styles.css`: estilos compartidos del sitio y panel.
- `server/index.js`: API, rutas de autenticación y estáticos.
- `server/db.js`: conexión y transacciones PostgreSQL.
- `server/schema.js`: inicialización aditiva del esquema y menú de arranque.
- `server/auth.js`: cookies de sesión y compatibilidad con hashes de contraseña de cuentas existentes.
- `server/recommend.js`: recomendaciones locales por similitud de recetas.

## Rutas principales

| Recurso | Colección | Elemento |
|---|---|---|
| Clientes | `/api/v1/clientes/` | `/api/v1/clientes/{id}/` |
| Ingredientes | `/api/v1/ingredientes/` | `/api/v1/ingredientes/{id}/` |
| Pizzas | `/api/v1/pizzas/` | `/api/v1/pizzas/{id}/` |
| Pedidos | `/api/v1/pedidos/` | `/api/v1/pedidos/{id}/` |
| Pagos | `/api/v1/pagos/` | `/api/v1/pagos/{id}/` |
| Recomendaciones | `/api/v1/recomendaciones/` | `/api/v1/recomendaciones/{id}/` |

Las rutas de gestión requieren una sesión de una cuenta con `is_staff` activa. El inicio de sesión verifica los hashes existentes de `auth_user`; la sesión se transporta en una cookie firmada y HTTP-only.
