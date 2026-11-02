const db = require('../../../database/database');
const { RecomendacionIA } = require('../models/recomendacionIA.model');

class RecomendacionIAService {

  findAll() {
    return db.prepare(`
      SELECT
        id,
        cliente_id AS clienteId,
        pizza_recomendada_id AS pizzaRecomendadaId,
        motivo,
        fecha,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM recomendaciones_ia
    `).all();
  }

  findById(id) {
    const recomendacion = db.prepare(`
      SELECT
        id,
        cliente_id AS clienteId,
        pizza_recomendada_id AS pizzaRecomendadaId,
        motivo,
        fecha,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM recomendaciones_ia
      WHERE id = ?
    `).get(id);

    if (!recomendacion) {
      throw new Error(`Recomendación con ID ${id} no encontrada`);
    }

    return recomendacion;
  }

  save(data) {
    const recomendacion = new RecomendacionIA(data);

    db.prepare(`
      INSERT INTO recomendaciones_ia (
        id,
        cliente_id,
        pizza_recomendada_id,
        motivo,
        fecha,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      recomendacion.id,
      recomendacion.clienteId,
      recomendacion.pizzaRecomendadaId,
      recomendacion.motivo,
      recomendacion.fecha,
      recomendacion.createdAt,
      recomendacion.updatedAt
    );

    return recomendacion;
  }

  update(id, data) {
    const actual = this.findById(id);

    const actualizada = {
      ...actual,
      ...data,
      id: actual.id,
      createdAt: actual.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      UPDATE recomendaciones_ia
      SET
        cliente_id = ?,
        pizza_recomendada_id = ?,
        motivo = ?,
        fecha = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      actualizada.clienteId,
      actualizada.pizzaRecomendadaId,
      actualizada.motivo,
      actualizada.fecha,
      actualizada.updatedAt,
      id
    );

    return actualizada;
  }

  delete(id) {
    const resultado = db.prepare(`
      DELETE FROM recomendaciones_ia
      WHERE id = ?
    `).run(id);

    if (resultado.changes === 0) {
      throw new Error(`Recomendación con ID ${id} no encontrada`);
    }
  }
}

module.exports = new RecomendacionIAService();