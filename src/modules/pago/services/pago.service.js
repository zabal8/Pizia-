const db = require('../../../database/database');
const { Pago } = require('../models/pago.model');

class PagoService {

  findAll() {
    return db.prepare(`
      SELECT
        id,
        pedido_id AS pedidoId,
        monto,
        metodo,
        fecha_pago AS fechaPago,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM pagos
    `).all();
  }

  findById(id) {
    const pago = db.prepare(`
      SELECT
        id,
        pedido_id AS pedidoId,
        monto,
        metodo,
        fecha_pago AS fechaPago,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM pagos
      WHERE id = ?
    `).get(id);

    if (!pago) {
      throw new Error(`Pago con ID ${id} no encontrado`);
    }

    return pago;
  }

  save(data) {
    const pago = new Pago(data);

    db.prepare(`
      INSERT INTO pagos (
        id,
        pedido_id,
        monto,
        metodo,
        fecha_pago,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      pago.id,
      pago.pedidoId,
      pago.monto,
      pago.metodo,
      pago.fechaPago,
      pago.createdAt,
      pago.updatedAt
    );

    return pago;
  }

  update(id, data) {
    const pagoActual = this.findById(id);

    const pagoActualizado = {
      ...pagoActual,
      ...data,
      id: pagoActual.id,
      createdAt: pagoActual.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      UPDATE pagos
      SET
        pedido_id = ?,
        monto = ?,
        metodo = ?,
        fecha_pago = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      pagoActualizado.pedidoId,
      pagoActualizado.monto,
      pagoActualizado.metodo,
      pagoActualizado.fechaPago,
      pagoActualizado.updatedAt,
      id
    );

    return pagoActualizado;
  }

  delete(id) {
    const resultado = db.prepare(`
      DELETE FROM pagos
      WHERE id = ?
    `).run(id);

    if (resultado.changes === 0) {
      throw new Error(`Pago con ID ${id} no encontrado`);
    }
  }
}

module.exports = new PagoService();