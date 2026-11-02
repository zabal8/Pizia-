# Estándar de Codificación PIZIA

## 1. Lenguaje

El proyecto PIZIA utiliza JavaScript como lenguaje principal para el desarrollo de la API REST.

## 2. Framework

Se utiliza Express.js para la construcción y gestión de las rutas de la API.

## 3. Nomenclatura

- Las variables y funciones utilizan camelCase.
- Las clases utilizan PascalCase.
- Los nombres deben ser descriptivos.
- Los nombres de archivos utilizan minúsculas y puntos para separar sus componentes.

Ejemplos:

- `cliente.service.js`
- `findById()`
- `createdAt`
- `ClienteService`

## 4. Indentación

Se utilizan 2 espacios para la indentación del código.

## 5. Variables

Se prioriza el uso de `const` y `let`.

Se evita el uso innecesario de `var`.

## 6. Organización

El proyecto utiliza una arquitectura modular.

Cada módulo separa:

- Models
- Services
- Controllers
- Routes

## 7. Funciones y métodos

Las funciones deben tener una responsabilidad específica y evitar realizar múltiples tareas independientes.

## 8. Comentarios

Los comentarios se utilizan únicamente cuando aportan información útil sobre:

- Procesos importantes.
- Decisiones de implementación.
- Funciones cuyo comportamiento requiere aclaración.

Se evita colocar comentarios innecesarios que simplemente repitan lo que hace el código.

## 9. Manejo de errores

Los servicios deben validar la existencia de los recursos y generar mensajes de error descriptivos.

Ejemplo:

`Cliente con ID determinado no encontrado`.

## 10. Persistencia

Los datos de la aplicación se almacenan de manera persistente utilizando SQLite mediante `better-sqlite3`.

## 11. Modularidad

Cada funcionalidad del sistema se desarrolla dentro de su propio módulo para facilitar:

- Mantenimiento.
- Reutilización.
- Pruebas.
- Escalabilidad.

## 12. Código limpio

Se evita:

- Código duplicado.
- Variables innecesarias.
- Funciones excesivamente grandes.
- Nombres poco descriptivos.

El objetivo es mantener un código legible, organizado y mantenible.