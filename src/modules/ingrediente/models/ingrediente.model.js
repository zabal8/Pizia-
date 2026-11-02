const { v4: uuidv4 } = require('uuid');

class Ingrediente {
  constructor({
    id,
    nombre,
    createdAt,
    updatedAt
  }) {
    this.id = id || uuidv4();
    this.nombre = nombre;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}

module.exports = { Ingrediente };
