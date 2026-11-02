const db = require('../../../database/database');
const { Ingrediente } = require('../models/ingrediente.model');

class IngredienteService {

  // Obtiene todos los ingredientes almacenados en SQLite.
  findAll() {
    return db.prepare(`
      SELECT
        id,
        nombre,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM ingredientes
    `).all();
  }

  // Busca un ingrediente por su identificador.
  findById(id) {
    const ingrediente = db.prepare(`
      SELECT
        id,
        nombre,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM ingredientes
      WHERE id = ?
    `).get(id);

    if (!ingrediente) {
      throw new Error(`Ingrediente con ID ${id} no encontrado`);
    }

    return ingrediente;
  }

  // Crea y almacena un nuevo ingrediente.
  save(data) {
    const ingrediente = new Ingrediente(data);

    db.prepare(`
      INSERT INTO ingredientes (
        id,
        nombre,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?)
    `).run(
      ingrediente.id,
      ingrediente.nombre,
      ingrediente.createdAt,
      ingrediente.updatedAt
    );

    return ingrediente;
  }

  // Actualiza un ingrediente existente.
  update(id, data) {
    const ingredienteActual = this.findById(id);

    const ingredienteActualizado = {
      ...ingredienteActual,
      ...data,
      id: ingredienteActual.id,
      createdAt: ingredienteActual.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      UPDATE ingredientes
      SET
        nombre = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      ingredienteActualizado.nombre,
      ingredienteActualizado.updatedAt,
      id
    );

    return ingredienteActualizado;
  }

  // Elimina un ingrediente.
  delete(id) {
    const resultado = db.prepare(`
      DELETE FROM ingredientes
      WHERE id = ?
    `).run(id);

    if (resultado.changes === 0) {
      throw new Error(`Ingrediente con ID ${id} no encontrado`);
    }
  }
}

module.exports = new IngredienteService();