const { v4: uuidv4 } = require('uuid');

class Pizza {
  constructor({
    id,
    nombre,
    precio,
    ingredientes = [],
    createdAt,
    updatedAt
  }) {
    this.id = id || uuidv4();
    this.nombre = nombre;
    this.precio = precio;
    this.ingredientes = ingredientes;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}

module.exports = { Pizza };
