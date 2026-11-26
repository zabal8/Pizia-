import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { query, transaction } from './db.js';
import { clearSession, encodeDjangoPassword, requireCustomer, requireStaff, sessionUser, setSession, verifyDjangoPassword } from './auth.js';
import { recommend } from './recommend.js';
import { initializeSchema } from './schema.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(sessionUser);

const sizes = ['pequena', 'porcion', 'mediana', 'grande'];
const states = ['recibido', 'preparando', 'listo', 'entregado', 'cancelado'];
const paymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
const sizeLabels = { pequena: 'Pequeña', porcion: 'Porción', mediana: 'Mediana', grande: 'Grande' };
const methods = {
  clientes: { table: 'pedidos_app_cliente', columns: ['nombre', 'email'], fields: ['id', 'nombre', 'email'] },
  ingredientes: { table: 'pedidos_app_ingrediente', columns: ['nombre'], fields: ['id', 'nombre'] },
};

function fail(res, status, detail) { return res.status(status).json({ detail }); }
function cleanEmail(value) { return String(value || '').trim().toLowerCase(); }
function emailOk(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function numberId(value) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }

async function getPizza(id) {
  const result = await query(`SELECT p.id, p.nombre, p.precio::text, p.tamano, COALESCE(json_agg(json_build_object('id', i.id, 'nombre', i.nombre)) FILTER (WHERE i.id IS NOT NULL), '[]') AS ingredientes
    FROM pedidos_app_pizza p LEFT JOIN pedidos_app_pizza_ingredientes pi ON pi.pizza_id=p.id
    LEFT JOIN pedidos_app_ingrediente i ON i.id=pi.ingrediente_id WHERE p.id=$1 GROUP BY p.id`, [id]);
  return result.rows[0] || null;
}

async function getPizzas() {
  const result = await query(`SELECT p.id, p.nombre, p.precio::text, p.tamano, COALESCE(json_agg(json_build_object('id', i.id, 'nombre', i.nombre)) FILTER (WHERE i.id IS NOT NULL), '[]') AS ingredientes
    FROM pedidos_app_pizza p LEFT JOIN pedidos_app_pizza_ingredientes pi ON pi.pizza_id=p.id
    LEFT JOIN pedidos_app_ingrediente i ON i.id=pi.ingrediente_id GROUP BY p.id ORDER BY p.nombre, p.tamano`);
  return result.rows;
}

async function getOrder(id) {
  const result = await query(`SELECT o.id, o.cliente_id AS cliente, o.pizza_id AS pizza, o.fecha, o.estado, o.metodo_pago_preferido,
    c.nombre AS cliente_nombre, c.email AS cliente_email,
    COALESCE(json_agg(json_build_object('pizza', p.id, 'nombre', p.nombre, 'tamano', p.tamano, 'cantidad', d.cantidad, 'precio_unitario', d.precio_unitario::text, 'subtotal', (d.cantidad*d.precio_unitario)::text)) FILTER (WHERE d.id IS NOT NULL), '[]') AS pizzas,
    COALESCE(SUM(d.cantidad*d.precio_unitario),0)::text AS total
    FROM pedidos_app_pedido o JOIN pedidos_app_cliente c ON c.id=o.cliente_id
    LEFT JOIN pedidos_app_detallepedido d ON d.pedido_id=o.id LEFT JOIN pedidos_app_pizza p ON p.id=d.pizza_id
    WHERE o.id=$1 GROUP BY o.id,c.id`, [id]);
  return result.rows[0] || null;
}

async function requireTables(_req, res, next) {
  try {
    await query('SELECT 1 FROM pedidos_app_pizza LIMIT 0');
    next();
  } catch (error) {
    console.error(error);
    fail(res, 503, 'No se pudo conectar con la base de datos del proyecto.');
  }
}
app.use('/api', requireTables);

// Authentication stays on the existing Django auth_user table, so current accounts and staff remain usable.
app.get('/auth/me', (req, res) => res.json({ user: req.user || null }));
app.post('/auth/login', async (req, res, next) => {
  try {
    const email = cleanEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const result = await query('SELECT id, username, first_name, email, password, is_staff, is_superuser, is_active FROM auth_user WHERE lower(email)=lower($1) OR lower(username)=lower($1) ORDER BY id LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user || !user.is_active || !(await verifyDjangoPassword(user.password, password))) return fail(res, 400, 'Correo o contraseña incorrectos.');
    await query('UPDATE auth_user SET last_login=NOW() WHERE id=$1', [user.id]);
    setSession(res, user);
    res.json({ user: { id: user.id, username: user.username, first_name: user.first_name, email: user.email, is_staff: user.is_staff } });
  } catch (error) { next(error); }
});
app.post('/auth/register', async (req, res, next) => {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    const email = cleanEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (nombre.length < 3 || nombre.length > 100) return fail(res, 400, 'El nombre debe tener entre 3 y 100 caracteres.');
    if (!emailOk(email)) return fail(res, 400, 'Escribe un correo electrónico válido.');
    if (password.length < 8 || /^\d+$/.test(password)) return fail(res, 400, 'Usa una contraseña de al menos 8 caracteres que no sea solo numérica.');
    const already = await query('SELECT 1 FROM auth_user WHERE lower(email)=lower($1) OR lower(username)=lower($1)', [email]);
    if (already.rowCount) return fail(res, 409, 'Ya existe una cuenta con este correo. Inicia sesión.');
    const passwordHash = await encodeDjangoPassword(password);
    const user = await transaction(async (db) => {
      const newUser = await db.query(`INSERT INTO auth_user (password,last_login,is_superuser,username,first_name,last_name,email,is_staff,is_active,date_joined)
        VALUES ($1,NULL,FALSE,$2,$3,'',$2,FALSE,TRUE,NOW()) RETURNING id,username,first_name,email,is_staff`, [passwordHash, email, nombre]);
      const client = await db.query('SELECT id FROM pedidos_app_cliente WHERE lower(email)=lower($1)', [email]);
      if (!client.rowCount) await db.query('INSERT INTO pedidos_app_cliente (nombre,email) VALUES ($1,$2)', [nombre, email]);
      else await db.query('UPDATE pedidos_app_cliente SET nombre=$1 WHERE id=$2', [nombre, client.rows[0].id]);
      return newUser.rows[0];
    });
    setSession(res, user);
    res.status(201).json({ user });
  } catch (error) { next(error); }
});
app.post('/auth/logout', (_req, res) => { clearSession(res); res.status(204).end(); });

app.get('/api/v1/pizzas/menu/', async (_req, res, next) => {
  try { res.json(await getPizzas()); } catch (error) { next(error); }
});

app.post('/api/v1/pedidos/publico/', async (req, res, next) => {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    const email = cleanEmail(req.body?.email);
    const items = req.body?.pizzas;
    const metodo = req.body?.metodo_pago_preferido || 'efectivo';
    if (req.user && !req.user.is_staff) {
      req.body.nombre = req.user.first_name || req.user.username;
      req.body.email = cleanEmail(req.user.email);
    }
    const finalName = String(req.body?.nombre || '').trim();
    const finalEmail = cleanEmail(req.body?.email);
    if (finalName.length < 3 || finalName.length > 100) return fail(res, 400, 'Escribe tu nombre (mínimo 3 caracteres).');
    if (!emailOk(finalEmail)) return fail(res, 400, 'Escribe un correo electrónico válido.');
    if (!Array.isArray(items) || !items.length) return fail(res, 400, 'Selecciona al menos una pizza.');
    if (!paymentMethods.includes(metodo)) return fail(res, 400, 'Selecciona un método de pago válido.');
    const ids = new Set();
    for (const item of items) {
      const id = numberId(item?.pizza_id);
      const quantity = Number(item?.cantidad ?? 1);
      if (!id || ids.has(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return fail(res, 400, 'Revisa las pizzas y sus cantidades.');
      ids.add(id);
    }
    const pizzas = await getPizzas();
    const byId = new Map(pizzas.map((pizza) => [Number(pizza.id), pizza]));
    const lines = items.map((item) => ({ pizza: byId.get(Number(item.pizza_id)), cantidad: Number(item.cantidad ?? 1) }));
    if (lines.some((line) => !line.pizza)) return fail(res, 400, 'Una de las pizzas seleccionadas ya no está disponible.');
    const id = await transaction(async (db) => {
      const clientResult = await db.query('SELECT id FROM pedidos_app_cliente WHERE lower(email)=lower($1)', [finalEmail]);
      let clientId = clientResult.rows[0]?.id;
      if (clientId) await db.query('UPDATE pedidos_app_cliente SET nombre=$1 WHERE id=$2', [finalName, clientId]);
      else clientId = (await db.query('INSERT INTO pedidos_app_cliente (nombre,email) VALUES ($1,$2) RETURNING id', [finalName, finalEmail])).rows[0].id;
      const order = await db.query(`INSERT INTO pedidos_app_pedido (cliente_id,pizza_id,fecha,estado,metodo_pago_preferido)
        VALUES ($1,$2,NOW(),'recibido',$3) RETURNING id`, [clientId, lines[0].pizza.id, metodo]);
      for (const line of lines) await db.query('INSERT INTO pedidos_app_detallepedido (pedido_id,pizza_id,cantidad,precio_unitario) VALUES ($1,$2,$3,$4)', [order.rows[0].id, line.pizza.id, line.cantidad, line.pizza.precio]);
      return order.rows[0].id;
    });
    const order = await getOrder(id);
    res.status(201).json({ id: order.id, fecha: order.fecha, estado: order.estado, pizzas: order.pizzas, total: order.total, cliente_nombre: order.cliente_nombre, email: order.cliente_email, metodo_pago_preferido: order.metodo_pago_preferido });
  } catch (error) { next(error); }
});

app.get('/api/v1/pedidos/seguimiento/', async (req, res, next) => {
  try {
    const id = numberId(req.query.numero);
    const email = cleanEmail(req.query.email);
    if (!id || !email) return fail(res, 400, 'Indica el número de pedido y el correo usado al comprar.');
    const order = await getOrder(id);
    if (!order || cleanEmail(order.cliente_email) !== email) return fail(res, 404, 'No encontramos un pedido con esos datos.');
    res.json(order);
  } catch (error) { next(error); }
});

app.get('/api/v1/recomendaciones-menu/', async (req, res, next) => {
  try {
    const raw = req.query.pizza;
    const ids = (Array.isArray(raw) ? raw : [raw]).filter(Boolean).map(numberId);
    if (!ids.length || ids.some((id) => !id)) return fail(res, 400, 'Selecciona al menos una pizza válida.');
    const pizzas = await getPizzas();
    if (!ids.some((id) => pizzas.some((pizza) => Number(pizza.id) === id))) return fail(res, 404, 'No se encontraron esas pizzas.');
    const popular = await query('SELECT p.nombre, SUM(d.cantidad)::int AS total FROM pedidos_app_detallepedido d JOIN pedidos_app_pizza p ON p.id=d.pizza_id GROUP BY p.nombre');
    const popularity = Object.fromEntries(popular.rows.map((item) => [item.nombre, item.total]));
    res.json({ motor: 'TF-IDF y similitud coseno (implementación local en Node.js)', recomendaciones: recommend(pizzas, ids, popularity) });
  } catch (error) { next(error); }
});

app.get('/api/v1/cuenta/pedidos/', requireCustomer, async (req, res, next) => {
  try {
    const result = await query('SELECT id FROM pedidos_app_pedido o JOIN pedidos_app_cliente c ON c.id=o.cliente_id WHERE lower(c.email)=lower($1) ORDER BY fecha DESC', [req.user.email]);
    const orders = await Promise.all(result.rows.map((row) => getOrder(row.id)));
    res.json(orders);
  } catch (error) { next(error); }
});

function paginated(rows, page, count) {
  const p = Math.max(1, Number(page) || 1);
  return { count, next: p * 20 < count ? `?page=${p + 1}` : null, previous: p > 1 ? `?page=${p - 1}` : null, results: rows };
}

app.get('/api/v1/clientes/catalogo/', requireStaff, async (_req, res, next) => {
  try { res.json((await query('SELECT id,nombre,email FROM pedidos_app_cliente ORDER BY nombre,id')).rows); } catch (error) { next(error); }
});
app.get('/api/v1/ingredientes/catalogo/', async (_req, res, next) => {
  try { res.json((await query('SELECT id,nombre FROM pedidos_app_ingrediente ORDER BY nombre')).rows); } catch (error) { next(error); }
});

function registerSimpleResource(name) {
  const config = methods[name];
  app.get(`/api/v1/${name}/`, requireStaff, async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const count = Number((await query(`SELECT count(*) FROM ${config.table}`)).rows[0].count);
      const rows = await query(`SELECT ${config.fields.join(',')} FROM ${config.table} ORDER BY id LIMIT 20 OFFSET $1`, [(page - 1) * 20]);
      res.json(paginated(rows.rows, page, count));
    } catch (error) { next(error); }
  });
  app.post(`/api/v1/${name}/`, requireStaff, async (req, res, next) => {
    try {
      const values = config.columns.map((key) => req.body?.[key]);
      if (name === 'clientes' && (String(values[0] || '').trim().length < 3 || !emailOk(cleanEmail(values[1])))) return fail(res, 400, 'Revisa el nombre y el correo del cliente.');
      if (name === 'ingredientes' && !String(values[0] || '').trim()) return fail(res, 400, 'El nombre es obligatorio.');
      const result = await query(`INSERT INTO ${config.table} (${config.columns.join(',')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(',')}) RETURNING ${config.fields.join(',')}`, values.map((v, i) => i === 0 ? String(v).trim() : name === 'clientes' ? cleanEmail(v) : v));
      res.status(201).json(result.rows[0]);
    } catch (error) { next(error); }
  });
  app.get(`/api/v1/${name}/:id/`, requireStaff, async (req, res, next) => {
    try { const row = await query(`SELECT ${config.fields.join(',')} FROM ${config.table} WHERE id=$1`, [numberId(req.params.id)]); row.rowCount ? res.json(row.rows[0]) : fail(res, 404, 'Registro no encontrado.'); } catch (error) { next(error); }
  });
  app.patch(`/api/v1/${name}/:id/`, requireStaff, async (req, res, next) => {
    try {
      const updates = config.columns.filter((key) => key in req.body);
      if (!updates.length) return fail(res, 400, 'No hay campos para actualizar.');
      const values = updates.map((key) => name === 'clientes' && key === 'email' ? cleanEmail(req.body[key]) : String(req.body[key]).trim());
      if (name === 'clientes' && (('nombre' in req.body && values[updates.indexOf('nombre')].length < 3) || ('email' in req.body && !emailOk(values[updates.indexOf('email')])))) return fail(res, 400, 'Revisa el nombre y el correo del cliente.');
      const id = numberId(req.params.id);
      const result = await query(`UPDATE ${config.table} SET ${updates.map((key, i) => `${key}=$${i + 1}`).join(',')} WHERE id=$${updates.length + 1} RETURNING ${config.fields.join(',')}`, [...values, id]);
      result.rowCount ? res.json(result.rows[0]) : fail(res, 404, 'Registro no encontrado.');
    } catch (error) { next(error); }
  });
  app.delete(`/api/v1/${name}/:id/`, requireStaff, async (req, res, next) => {
    try { const result = await query(`DELETE FROM ${config.table} WHERE id=$1`, [numberId(req.params.id)]); result.rowCount ? res.status(204).end() : fail(res, 404, 'Registro no encontrado.'); } catch (error) { next(error); }
  });
}
Object.keys(methods).forEach(registerSimpleResource);

app.get('/api/v1/ingredientes/', requireStaff, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const count = Number((await query('SELECT count(*) FROM pedidos_app_ingrediente')).rows[0].count);
    const rows = await query('SELECT id,nombre FROM pedidos_app_ingrediente ORDER BY id LIMIT 20 OFFSET $1', [(page - 1) * 20]);
    res.json(paginated(rows.rows, page, count));
  } catch (error) { next(error); }
});

app.get('/api/v1/pizzas/', requireStaff, async (req, res, next) => {
  try { const rows = await getPizzas(); res.json(paginated(rows, req.query.page, rows.length)); } catch (error) { next(error); }
});
app.get('/api/v1/pizzas/:id/', requireStaff, async (req, res, next) => {
  try { const pizza = await getPizza(numberId(req.params.id)); pizza ? res.json(pizza) : fail(res, 404, 'Pizza no encontrada.'); } catch (error) { next(error); }
});
app.post('/api/v1/pizzas/', requireStaff, async (req, res, next) => {
  try {
    const { nombre, precio, tamano = 'mediana', ingredientes = [] } = req.body || {};
    if (!String(nombre || '').trim() || !Number.isFinite(Number(precio)) || Number(precio) <= 0 || !sizes.includes(tamano) || !Array.isArray(ingredientes)) return fail(res, 400, 'Revisa los datos de la pizza.');
    const id = await transaction(async (db) => {
      const result = await db.query('INSERT INTO pedidos_app_pizza (nombre,precio,tamano) VALUES ($1,$2,$3) RETURNING id', [String(nombre).trim(), precio, tamano]);
      for (const item of new Set(ingredientes.map(numberId).filter(Boolean))) await db.query('INSERT INTO pedidos_app_pizza_ingredientes (pizza_id,ingrediente_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [result.rows[0].id, item]);
      return result.rows[0].id;
    });
    res.status(201).json(await getPizza(id));
  } catch (error) { next(error); }
});
app.patch('/api/v1/pizzas/:id/', requireStaff, async (req, res, next) => {
  try {
    const id = numberId(req.params.id);
    const old = await getPizza(id);
    if (!old) return fail(res, 404, 'Pizza no encontrada.');
    const nombre = 'nombre' in req.body ? String(req.body.nombre).trim() : old.nombre;
    const precio = 'precio' in req.body ? Number(req.body.precio) : Number(old.precio);
    const tamano = req.body.tamano || old.tamano;
    const ingredients = 'ingredientes' in req.body ? req.body.ingredientes : old.ingredientes.map((item) => item.id);
    if (!nombre || !Number.isFinite(precio) || precio <= 0 || !sizes.includes(tamano) || !Array.isArray(ingredients)) return fail(res, 400, 'Revisa los datos de la pizza.');
    await transaction(async (db) => {
      await db.query('UPDATE pedidos_app_pizza SET nombre=$1,precio=$2,tamano=$3 WHERE id=$4', [nombre, precio, tamano, id]);
      await db.query('DELETE FROM pedidos_app_pizza_ingredientes WHERE pizza_id=$1', [id]);
      for (const ingredient of new Set(ingredients.map(numberId).filter(Boolean))) await db.query('INSERT INTO pedidos_app_pizza_ingredientes (pizza_id,ingrediente_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, ingredient]);
    });
    res.json(await getPizza(id));
  } catch (error) { next(error); }
});
app.delete('/api/v1/pizzas/:id/', requireStaff, async (req, res, next) => {
  try { const result = await query('DELETE FROM pedidos_app_pizza WHERE id=$1', [numberId(req.params.id)]); result.rowCount ? res.status(204).end() : fail(res, 404, 'Pizza no encontrada.'); } catch (error) { next(error); }
});

app.get('/api/v1/pedidos/', requireStaff, async (req, res, next) => {
  try { const ids = await query('SELECT id FROM pedidos_app_pedido ORDER BY fecha DESC'); const rows = await Promise.all(ids.rows.map(({ id }) => getOrder(id))); res.json(paginated(rows, req.query.page, rows.length)); } catch (error) { next(error); }
});
app.get('/api/v1/pedidos/catalogo/', requireStaff, async (_req, res, next) => {
  try { const ids = await query('SELECT id FROM pedidos_app_pedido ORDER BY fecha DESC'); res.json(await Promise.all(ids.rows.map(({ id }) => getOrder(id)))); } catch (error) { next(error); }
});
app.get('/api/v1/pedidos/:id/', requireStaff, async (req, res, next) => {
  try { const order = await getOrder(numberId(req.params.id)); order ? res.json(order) : fail(res, 404, 'Pedido no encontrado.'); } catch (error) { next(error); }
});
app.post('/api/v1/pedidos/', requireStaff, async (req, res, next) => {
  try {
    const cliente = numberId(req.body?.cliente);
    const ids = Array.isArray(req.body?.pizza_ids) ? req.body.pizza_ids.map(numberId).filter(Boolean) : req.body?.pizza ? [numberId(req.body.pizza)].filter(Boolean) : [];
    if (!cliente || !ids.length) return fail(res, 400, 'Selecciona un cliente y al menos una pizza.');
    const pizzas = await Promise.all(ids.map(getPizza));
    if (pizzas.some((item) => !item)) return fail(res, 400, 'Una de las pizzas no existe.');
    const state = req.body.estado || 'recibido';
    if (!states.includes(state)) return fail(res, 400, 'Estado no válido.');
    const id = await transaction(async (db) => {
      const order = await db.query('INSERT INTO pedidos_app_pedido (cliente_id,pizza_id,fecha,estado,metodo_pago_preferido) VALUES ($1,$2,NOW(),$3,$4) RETURNING id', [cliente, pizzas[0].id, state, req.body.metodo_pago_preferido || 'efectivo']);
      for (const pizza of pizzas) await db.query('INSERT INTO pedidos_app_detallepedido (pedido_id,pizza_id,cantidad,precio_unitario) VALUES ($1,$2,1,$3)', [order.rows[0].id, pizza.id, pizza.precio]);
      return order.rows[0].id;
    });
    res.status(201).json(await getOrder(id));
  } catch (error) { next(error); }
});
app.delete('/api/v1/pedidos/:id/', requireStaff, async (req, res, next) => {
  try { const result = await query('DELETE FROM pedidos_app_pedido WHERE id=$1', [numberId(req.params.id)]); result.rowCount ? res.status(204).end() : fail(res, 404, 'Pedido no encontrado.'); } catch (error) { next(error); }
});

app.patch('/api/v1/pedidos/:id/', requireStaff, async (req, res, next) => {
  try {
    const id = numberId(req.params.id);
    const existing = await getOrder(id);
    if (!existing) return fail(res, 404, 'Pedido no encontrado.');
    const state = req.body.estado || existing.estado;
    const payment = req.body.metodo_pago_preferido || existing.metodo_pago_preferido;
    const clientId = req.body.cliente ? numberId(req.body.cliente) : Number(existing.cliente);
    if (!states.includes(state) || !paymentMethods.includes(payment) || !clientId) return fail(res, 400, 'Estado, cliente o método de pago no válido.');
    let pizzas = null;
    if (Array.isArray(req.body.pizza_ids)) pizzas = req.body.pizza_ids.map(numberId).filter(Boolean);
    else if (req.body.pizza) pizzas = [numberId(req.body.pizza)].filter(Boolean);
    if (pizzas && !pizzas.length) return fail(res, 400, 'Selecciona al menos una pizza.');
    if (pizzas) {
      const current = await Promise.all(pizzas.map(getPizza));
      if (current.some((item) => !item)) return fail(res, 400, 'Una de las pizzas no existe.');
      await transaction(async (db) => {
        await db.query('UPDATE pedidos_app_pedido SET cliente_id=$1,pizza_id=$2,estado=$3,metodo_pago_preferido=$4 WHERE id=$5', [clientId, current[0].id, state, payment, id]);
        await db.query('DELETE FROM pedidos_app_detallepedido WHERE pedido_id=$1', [id]);
        for (const item of current) await db.query('INSERT INTO pedidos_app_detallepedido (pedido_id,pizza_id,cantidad,precio_unitario) VALUES ($1,$2,1,$3)', [id, item.id, item.precio]);
      });
    } else await query('UPDATE pedidos_app_pedido SET cliente_id=$1,estado=$2,metodo_pago_preferido=$3 WHERE id=$4', [clientId, state, payment, id]);
    res.json(await getOrder(id));
  } catch (error) { next(error); }
});

app.get('/api/v1/pagos/', requireStaff, async (req, res, next) => {
  try {
    const result = await query(`SELECT p.id,p.pedido_id AS pedido,p.monto::text,p.metodo,p.fecha_pago FROM pedidos_app_pago p ORDER BY id DESC`);
    res.json(paginated(result.rows, req.query.page, result.rowCount));
  } catch (error) { next(error); }
});
app.get('/api/v1/pagos/:id/', requireStaff, async (req, res, next) => {
  try {
    const result = await query('SELECT id,pedido_id AS pedido,monto::text,metodo,fecha_pago FROM pedidos_app_pago WHERE id=$1', [numberId(req.params.id)]);
    result.rowCount ? res.json(result.rows[0]) : fail(res, 404, 'Pago no encontrado.');
  } catch (error) { next(error); }
});
app.post('/api/v1/pagos/', requireStaff, async (req, res, next) => {
  try {
    const orderId = numberId(req.body?.pedido);
    const order = orderId && await getOrder(orderId);
    const amount = Number(req.body?.monto);
    const method = req.body?.metodo;
    if (!order || !Number.isFinite(amount) || amount.toFixed(2) !== Number(order.total).toFixed(2) || !paymentMethods.includes(method)) return fail(res, 400, { monto: 'El pago debe corresponder al total de un pedido y usar un método válido.' });
    const result = await query('INSERT INTO pedidos_app_pago (pedido_id,monto,metodo,fecha_pago) VALUES ($1,$2,$3,NOW()) RETURNING id,pedido_id AS pedido,monto::text,metodo,fecha_pago', [orderId, amount, method]);
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});
app.patch('/api/v1/pagos/:id/', requireStaff, async (req, res, next) => {
  try {
    const id = numberId(req.params.id);
    const current = await query('SELECT id,pedido_id AS pedido,monto::text,metodo FROM pedidos_app_pago WHERE id=$1', [id]);
    if (!current.rowCount) return fail(res, 404, 'Pago no encontrado.');
    const orderId = req.body.pedido ? numberId(req.body.pedido) : Number(current.rows[0].pedido);
    const amount = req.body.monto === undefined ? Number(current.rows[0].monto) : Number(req.body.monto);
    const method = req.body.metodo || current.rows[0].metodo;
    const order = orderId && await getOrder(orderId);
    if (!order || !Number.isFinite(amount) || amount.toFixed(2) !== Number(order.total).toFixed(2) || !paymentMethods.includes(method)) return fail(res, 400, 'El pago debe coincidir con el total del pedido y usar un método válido.');
    const result = await query('UPDATE pedidos_app_pago SET pedido_id=$1,monto=$2,metodo=$3 WHERE id=$4 RETURNING id,pedido_id AS pedido,monto::text,metodo,fecha_pago', [orderId,amount,method,id]);
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});
app.delete('/api/v1/pagos/:id/', requireStaff, async (req, res, next) => {
  try { const result = await query('DELETE FROM pedidos_app_pago WHERE id=$1', [numberId(req.params.id)]); result.rowCount ? res.status(204).end() : fail(res, 404, 'Pago no encontrado.'); } catch (error) { next(error); }
});

app.get('/api/v1/recomendaciones/sugerir/', requireStaff, async (req, res, next) => {
  try {
    const clientId = numberId(req.query.cliente);
    if (!clientId) return fail(res, 400, 'Indica un cliente válido en ?cliente=ID.');
    const history = await query('SELECT d.pizza_id,d.cantidad FROM pedidos_app_detallepedido d JOIN pedidos_app_pedido o ON o.id=d.pedido_id WHERE o.cliente_id=$1', [clientId]);
    const popular = await query('SELECT p.nombre,SUM(d.cantidad)::int AS total FROM pedidos_app_detallepedido d JOIN pedidos_app_pizza p ON p.id=d.pizza_id GROUP BY p.nombre');
    const allPizzas = await getPizzas();
    res.json({ motor: 'TF-IDF y similitud coseno (implementación local en Node.js)', personalizada: history.rowCount > 0, recomendaciones: recommend(allPizzas, history.rows.flatMap((item) => Array(Number(item.cantidad)).fill(Number(item.pizza_id))), Object.fromEntries(popular.rows.map((item) => [item.nombre, item.total]))) });
  } catch (error) { next(error); }
});

app.get('/api/v1/recomendaciones/', requireStaff, async (req, res, next) => {
  try {
    const rows = await query('SELECT id,cliente_id AS cliente,pizza_recomendada_id AS pizza_recomendada,motivo,fecha FROM pedidos_app_recomendacionia ORDER BY id LIMIT 20 OFFSET $1', [(Math.max(1, Number(req.query.page) || 1) - 1) * 20]);
    const count = Number((await query('SELECT count(*) FROM pedidos_app_recomendacionia')).rows[0].count);
    res.json(paginated(rows.rows, req.query.page, count));
  } catch (error) { next(error); }
});
app.post('/api/v1/recomendaciones/', requireStaff, async (req, res, next) => {
  try {
    const clientId = numberId(req.body?.cliente); const pizzaId = numberId(req.body?.pizza_recomendada); const motive = String(req.body?.motivo || '').trim();
    if (!clientId || !pizzaId || !motive) return fail(res, 400, 'Cliente, pizza recomendada y motivo son obligatorios.');
    const result = await query('INSERT INTO pedidos_app_recomendacionia (cliente_id,pizza_recomendada_id,motivo,fecha) VALUES ($1,$2,$3,NOW()) RETURNING id,cliente_id AS cliente,pizza_recomendada_id AS pizza_recomendada,motivo,fecha', [clientId,pizzaId,motive]);
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});
app.get('/api/v1/recomendaciones/:id/', requireStaff, async (req, res, next) => {
  try {
    const result = await query('SELECT id,cliente_id AS cliente,pizza_recomendada_id AS pizza_recomendada,motivo,fecha FROM pedidos_app_recomendacionia WHERE id=$1', [numberId(req.params.id)]);
    result.rowCount ? res.json(result.rows[0]) : fail(res, 404, 'Recomendación no encontrada.');
  } catch (error) { next(error); }
});
app.patch('/api/v1/recomendaciones/:id/', requireStaff, async (req, res, next) => {
  try {
    const id = numberId(req.params.id);
    const old = await query('SELECT id,cliente_id AS cliente,pizza_recomendada_id AS pizza_recomendada,motivo,fecha FROM pedidos_app_recomendacionia WHERE id=$1', [id]);
    if (!old.rowCount) return fail(res, 404, 'Recomendación no encontrada.');
    const cliente = 'cliente' in req.body ? numberId(req.body.cliente) : Number(old.rows[0].cliente);
    const pizza = 'pizza_recomendada' in req.body ? numberId(req.body.pizza_recomendada) : Number(old.rows[0].pizza_recomendada);
    const motive = 'motivo' in req.body ? String(req.body.motivo).trim() : old.rows[0].motivo;
    if (!cliente || !pizza || !motive) return fail(res, 400, 'Cliente, pizza recomendada y motivo son obligatorios.');
    const result = await query('UPDATE pedidos_app_recomendacionia SET cliente_id=$1,pizza_recomendada_id=$2,motivo=$3 WHERE id=$4 RETURNING id,cliente_id AS cliente,pizza_recomendada_id AS pizza_recomendada,motivo,fecha', [cliente,pizza,motive,id]);
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});
app.delete('/api/v1/recomendaciones/:id/', requireStaff, async (req, res, next) => {
  try { const result = await query('DELETE FROM pedidos_app_recomendacionia WHERE id=$1', [numberId(req.params.id)]); result.rowCount ? res.status(204).end() : fail(res, 404, 'Recomendación no encontrada.'); } catch (error) { next(error); }
});

app.use('/api/v1', requireStaff, (_req, res) => fail(res, 404, 'Ruta no encontrada.'));
app.use('/static', express.static(path.join(root, 'static')));
app.use(express.static(path.join(root, 'dist')));
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html'), (error) => {
  if (error) res.status(503).send('Ejecuta npm run build para preparar la aplicación React.');
}));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === '23505') return fail(res, 409, 'Ya existe un registro con esos datos.');
  if (error.code === '23503') return fail(res, 409, 'No se puede eliminar: el registro tiene historial relacionado.');
  fail(res, 500, 'Ocurrió un error al procesar la solicitud.');
});

if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('En producción, configura SESSION_SECRET con al menos 32 caracteres.');
}

initializeSchema().then(() => app.listen(port, () => console.log(`PizIA escuchando en http://localhost:${port}`)))
  .catch((error) => { console.error('No se pudo preparar el esquema de PizIA:', error); process.exit(1); });
