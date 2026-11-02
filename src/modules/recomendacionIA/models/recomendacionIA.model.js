const { v4: uuidv4 } = require('uuid');

class RecomendacionIA {
  constructor({
    id,
    clienteId,
    pizzaRecomendadaId,
    motivo,
    fecha,
    createdAt,
    updatedAt
  }) {
    this.id = id || uuidv4();
    this.clienteId = clienteId;
    this.pizzaRecomendadaId = pizzaRecomendadaId;
    this.motivo = motivo;
    this.fecha = fecha || new Date().toISOString();
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}

module.exports = { RecomendacionIA };