const db = require('../../../database/database');
const { Cliente } = require('../models/cliente.model');

class ClienteService {

  findAll() {
    const rows = db.prepare(`
      SELECT
        id,
        nombre,
        email,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM clientes
    `).all();

    return rows;
  }

  findById(id) {
    const row = db.prepare(`
      SELECT
        id,
        nombre,
        email,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM clientes
      WHERE id = ?
    `).get(id);

    if (!row) {
      const error = new Error(
        `Cliente con ID ${id} no encontrado`
      );

      error.code = 'NOT_FOUND';

      throw error;
    }

    return row;
  }

  save(data) {

    const existe = db.prepare(`
      SELECT id
      FROM clientes
      WHERE email = ?
    `).get(data.email);

    if (existe) {
      const error = new Error(
        'Ya existe un cliente con ese email'
      );

      error.code = 'DUPLICATE_EMAIL';

      throw error;
    }

    const cliente = new Cliente(data);

    db.prepare(`
      INSERT INTO clientes (
        id,
        nombre,
        email,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      cliente.id,
      cliente.nombre,
      cliente.email,
      cliente.createdAt,
      cliente.updatedAt
    );

    return cliente;
  }

  update(id, data) {

    const clienteActual = this.findById(id);

    // Verificar si el email ya pertenece
    // a otro cliente
    const emailExistente = db.prepare(`
      SELECT id
      FROM clientes
      WHERE email = ?
      AND id != ?
    `).get(
      data.email,
      id
    );

    if (emailExistente) {
      const error = new Error(
        'Ya existe otro cliente con ese email'
      );

      error.code = 'DUPLICATE_EMAIL';

      throw error;
    }

    const clienteActualizado = {
      ...clienteActual,
      ...data,
      id: clienteActual.id,
      createdAt: clienteActual.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      UPDATE clientes
      SET
        nombre = ?,
        email = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      clienteActualizado.nombre,
      clienteActualizado.email,
      clienteActualizado.updatedAt,
      id
    );

    return clienteActualizado;
  }

  delete(id) {

    const resultado = db.prepare(`
      DELETE FROM clientes
      WHERE id = ?
    `).run(id);

    if (resultado.changes === 0) {
      const error = new Error(
        `Cliente con ID ${id} no encontrado`
      );

      error.code = 'NOT_FOUND';

      throw error;
    }
  }
}

module.exports = new ClienteService();