const db = require('./database');

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ingredientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  DROP TABLE IF EXISTS pagos;
  DROP TABLE IF EXISTS pedidos;
  DROP TABLE IF EXISTS recomendaciones_ia;
  DROP TABLE IF EXISTS pizzas;

  CREATE TABLE pizzas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL,
    ingredientes TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE pedidos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT,
    pizza_id TEXT,
    fecha TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (pizza_id) REFERENCES pizzas(id)
  );

  CREATE TABLE pagos (
    id TEXT PRIMARY KEY,
    pedido_id TEXT,
    monto REAL NOT NULL,
    metodo TEXT NOT NULL,
    fecha_pago TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
  );

  CREATE TABLE recomendaciones_ia (
    id TEXT PRIMARY KEY,
    cliente_id TEXT,
    pizza_recomendada_id TEXT,
    motivo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (pizza_recomendada_id) REFERENCES pizzas(id)
  );
`);

console.log('Tablas de PIZIA verificadas correctamente.');

module.exports = db;