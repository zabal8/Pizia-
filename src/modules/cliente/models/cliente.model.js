const { v4: uuidv4 } = require('uuid');

class Cliente {
  constructor({ id, nombre, email, createdAt, updatedAt }) {
    this.id = id || uuidv4();
    this.nombre = nombre;
    this.email = email;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}

module.exports = { Cliente };