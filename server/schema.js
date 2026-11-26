import { pool, transaction } from './db.js';

// The table names and columns match the existing Django models. IF NOT EXISTS
// lets a migrated PizIA database keep all of its existing rows and IDs.
export async function initializeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos_app_cliente (
      id BIGSERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS pedidos_app_ingrediente (
      id BIGSERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pedidos_app_pizza (
      id BIGSERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      precio NUMERIC(10,2) NOT NULL,
      tamano VARCHAR(10) NOT NULL DEFAULT 'mediana'
    );
    ALTER TABLE pedidos_app_pizza ADD COLUMN IF NOT EXISTS tamano VARCHAR(10) NOT NULL DEFAULT 'mediana';
    CREATE TABLE IF NOT EXISTS pedidos_app_pizza_ingredientes (
      id BIGSERIAL PRIMARY KEY,
      pizza_id BIGINT NOT NULL REFERENCES pedidos_app_pizza(id) ON DELETE CASCADE,
      ingrediente_id BIGINT NOT NULL REFERENCES pedidos_app_ingrediente(id) ON DELETE CASCADE,
      CONSTRAINT pedidos_app_pizza_ingredientes_pizza_ingrediente_unique UNIQUE (pizza_id, ingrediente_id)
    );
    CREATE TABLE IF NOT EXISTS pedidos_app_pedido (
      id BIGSERIAL PRIMARY KEY,
      cliente_id BIGINT NOT NULL REFERENCES pedidos_app_cliente(id) ON DELETE RESTRICT,
      pizza_id BIGINT REFERENCES pedidos_app_pizza(id) ON DELETE RESTRICT,
      fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      estado VARCHAR(20) NOT NULL DEFAULT 'recibido',
      metodo_pago_preferido VARCHAR(20) NOT NULL DEFAULT 'efectivo'
    );
    ALTER TABLE pedidos_app_pedido ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'recibido';
    ALTER TABLE pedidos_app_pedido ADD COLUMN IF NOT EXISTS metodo_pago_preferido VARCHAR(20) NOT NULL DEFAULT 'efectivo';
    CREATE TABLE IF NOT EXISTS pedidos_app_detallepedido (
      id BIGSERIAL PRIMARY KEY,
      pedido_id BIGINT NOT NULL REFERENCES pedidos_app_pedido(id) ON DELETE CASCADE,
      pizza_id BIGINT NOT NULL REFERENCES pedidos_app_pizza(id) ON DELETE RESTRICT,
      cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad >= 0),
      precio_unitario NUMERIC(10,2) NOT NULL,
      CONSTRAINT pedido_pizza_unica UNIQUE (pedido_id, pizza_id)
    );
    CREATE TABLE IF NOT EXISTS pedidos_app_pago (
      id BIGSERIAL PRIMARY KEY,
      pedido_id BIGINT NOT NULL UNIQUE REFERENCES pedidos_app_pedido(id) ON DELETE RESTRICT,
      monto NUMERIC(10,2) NOT NULL,
      metodo VARCHAR(50) NOT NULL,
      fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pedidos_app_recomendacionia (
      id BIGSERIAL PRIMARY KEY,
      cliente_id BIGINT NOT NULL REFERENCES pedidos_app_cliente(id) ON DELETE RESTRICT,
      pizza_recomendada_id BIGINT NOT NULL REFERENCES pedidos_app_pizza(id) ON DELETE RESTRICT,
      motivo TEXT NOT NULL,
      fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS auth_user (
      id BIGSERIAL PRIMARY KEY,
      password VARCHAR(128) NOT NULL,
      last_login TIMESTAMPTZ,
      is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
      username VARCHAR(150) NOT NULL UNIQUE,
      first_name VARCHAR(150) NOT NULL DEFAULT '',
      last_name VARCHAR(150) NOT NULL DEFAULT '',
      email VARCHAR(254) NOT NULL DEFAULT '',
      is_staff BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS pedidos_app_pedido_cliente_id_idx ON pedidos_app_pedido(cliente_id);
    CREATE INDEX IF NOT EXISTS pedidos_app_detallepedido_pedido_id_idx ON pedidos_app_detallepedido(pedido_id);
  `);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM pedidos_app_pizza');
  if (rows[0].count) return;

  const sizes = { pequena: -5000, porcion: -7000, mediana: 0, grande: 10000 };
  const menu = {
    Margarita: [20000, ['Salsa de tomate', 'Queso mozzarella', 'Albahaca', 'Queso parmesano']],
    Pepperoni: [22000, ['Salsa de tomate', 'Queso mozzarella', 'Pepperoni']],
    Capricciosa: [27000, ['Salsa de tomate', 'Queso mozzarella', 'Aceite de oliva', 'Alcachofas', 'Champiñones', 'Jamón cocido', 'Aceitunas negras']],
    Mushroom: [23000, ['Salsa de tomate', 'Queso mozzarella', 'Ajo', 'Champiñones', 'Perejil', 'Albahaca', 'Queso parmesano']],
    Marinara: [26000, ['Salsa de tomate', 'Ajo', 'Orégano seco']],
    Seafood: [30000, ['Camarones o langostinos', 'Mejillones', 'Almejas', 'Calamar o pulpo', 'Ajo', 'Perejil', 'Limón', 'Salsa de tomate', 'Queso mozzarella']],
    Hawaiana: [15000, ['Piña', 'Jamón cocido', 'Salsa de tomate', 'Queso mozzarella']],
    Vegetariana: [19000, ['Pimiento', 'Calabacín', 'Berenjena', 'Maíz dulce', 'Tomate cherry', 'Rúcula', 'Salsa de tomate', 'Queso']],
    Mexicana: [35000, ['Carne molida', 'Frijoles', 'Chile jalapeño', 'Cebolla', 'Maíz tierno', 'Aguacate', 'Cilantro', 'Nachos', 'Salsa de tomate', 'Queso asadero']],
    Carnes: [24000, ['Pepperoni', 'Tocineta', 'Jamón cocido', 'Carne', 'Pollo desmechado', 'Salsa de tomate', 'Queso mozzarella']],
  };
  await transaction(async (db) => {
    for (const [name, [basePrice, ingredientNames]] of Object.entries(menu)) {
      const ingredientIds = [];
      for (const ingredientName of ingredientNames) {
        const existing = await db.query('SELECT id FROM pedidos_app_ingrediente WHERE lower(nombre)=lower($1) ORDER BY id LIMIT 1', [ingredientName]);
        const id = existing.rows[0]?.id || (await db.query('INSERT INTO pedidos_app_ingrediente (nombre) VALUES ($1) RETURNING id', [ingredientName])).rows[0].id;
        ingredientIds.push(id);
      }
      for (const [size, adjustment] of Object.entries(sizes)) {
        const pizza = await db.query('INSERT INTO pedidos_app_pizza (nombre,precio,tamano) VALUES ($1,$2,$3) RETURNING id', [name, basePrice + adjustment, size]);
        for (const ingredientId of ingredientIds) await db.query('INSERT INTO pedidos_app_pizza_ingredientes (pizza_id,ingrediente_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [pizza.rows[0].id, ingredientId]);
      }
    }
  });
}
