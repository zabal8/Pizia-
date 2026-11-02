const db = require('../../../database/database');
const { Pizza } = require('../models/pizza.model');

class PizzaService {

  findAll() {
    const rows = db.prepare(`
      SELECT
        id,
        nombre,
        precio,
        ingredientes,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM pizzas
    `).all();

    return rows.map(row => ({
      ...row,
      ingredientes: JSON.parse(row.ingredientes)
    }));
  }

  findById(id) {
    const row = db.prepare(`
      SELECT
        id,
        nombre,
        precio,
        ingredientes,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM pizzas
      WHERE id = ?
    `).get(id);

    if (!row) {
      throw new Error(`Pizza con ID ${id} no encontrada`);
    }

    return {
      ...row,
      ingredientes: JSON.parse(row.ingredientes)
    };
  }

  save(data) {
    const pizza = new Pizza(data);

    db.prepare(`
      INSERT INTO pizzas (
        id,
        nombre,
        precio,
        ingredientes,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      pizza.id,
      pizza.nombre,
      pizza.precio,
      JSON.stringify(pizza.ingredientes),
      pizza.createdAt,
      pizza.updatedAt
    );

    return pizza;
  }

  update(id, data) {
    const pizzaActual = this.findById(id);

    const pizzaActualizada = {
      ...pizzaActual,
      ...data,
      id: pizzaActual.id,
      createdAt: pizzaActual.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      UPDATE pizzas
      SET
        nombre = ?,
        precio = ?,
        ingredientes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      pizzaActualizada.nombre,
      pizzaActualizada.precio,
      JSON.stringify(pizzaActualizada.ingredientes),
      pizzaActualizada.updatedAt,
      id
    );

    return pizzaActualizada;
  }

  delete(id) {
    const resultado = db.prepare(`
      DELETE FROM pizzas
      WHERE id = ?
    `).run(id);

    if (resultado.changes === 0) {
      throw new Error(`Pizza con ID ${id} no encontrada`);
    }
  }
}

module.exports = new PizzaService();