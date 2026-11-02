const Database = require('better-sqlite3');
const path = require('path');

// Define la ubicación de la base de datos.
const databasePath = path.join(__dirname, 'pizia.db');

// Crea o abre la base de datos SQLite.
const db = new Database(databasePath);

// Activa las claves foráneas de SQLite.
db.pragma('foreign_keys = ON');

console.log('Base de datos SQLite conectada correctamente.');

module.exports = db;