const db = require('../../../database/database');
const { Pedido } = require('../models/pedido.model');

class PedidoService {

  findAll() {
    return db.prepare(`
      SELECT
        id,
        cliente_id AS clienteId,
        pizza_id AS pizzaId,
        fecha,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM pedidos
    `).all();
  }

  findById(id) {
    const pedido = db.prepare(`
      SELECT
        id,
        cliente_id AS clienteId,
        pizza_id AS pizzaId,
        fecha,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM pedidos
      WHERE id = ?
    `).get(id);

    if (!pedido) {
      throw new Error(`Pedido con ID ${id} no encontrado`);
    }

    return pedido;
  }

  save(data) {
    const pedido = new Pedido(data);

    db.prepare(`
      INSERT INTO pedidos (
        id,
        cliente_id,
        pizza_id,
        fecha,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      pedido.id,
      pedido.clienteId,
      pedido.pizzaId,
      pedido.fecha,
      pedido.createdAt,
      pedido.updatedAt
    );

    return pedido;
  }

  update(id, data) {
    const pedidoActual = this.findById(id);

    const pedidoActualizado = {
      ...pedidoActual,
      ...data,
      id: pedidoActual.id,
      createdAt: pedidoActual.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      UPDATE pedidos
      SET
        cliente_id = ?,
        pizza_id = ?,
        fecha = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      pedidoActualizado.clienteId,
      pedidoActualizado.pizzaId,
      pedidoActualizado.fecha,
      pedidoActualizado.updatedAt,
      id
    );

    return pedidoActualizado;
  }

  delete(id) {
    const resultado = db.prepare(`
      DELETE FROM pedidos
      WHERE id = ?
    `).run(id);

    if (resultado.changes === 0) {
      throw new Error(`Pedido con ID ${id} no encontrado`);
    }
  }
}

module.exports = new PedidoService();