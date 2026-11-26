# Despliegue

Configura una plataforma que ejecute Node.js 20 o superior y pueda conectarse a PostgreSQL. Mantén las credenciales fuera del repositorio.

Define `DATABASE_URL` (o `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT`), `SESSION_SECRET`, `NODE_ENV=production` y el `PORT` que indique la plataforma. Usa `DATABASE_SSL=true` si el servidor PostgreSQL requiere SSL. En producción, las cookies usan HTTPS.

Comandos de build y arranque:

```sh
npm install
npm run build
npm start
```

El proceso Node prepara el esquema con operaciones aditivas, sirve la API y publica el build de React. La plataforma y la URL de producción siguen pendientes de definir.
