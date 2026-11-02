const { v4: uuidv4 } = require('uuid');

class Pedido {
  constructor({
    id,
    clienteId,
    pizzaId,
    fecha,
    createdAt,
    updatedAt
  }) {
    this.id = id || uuidv4();
    this.clienteId = clienteId;
    this.pizzaId = pizzaId;
    this.fecha = fecha || new Date().toISOString();
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}

module.exports = { Pedido };