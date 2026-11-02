const { v4: uuidv4 } = require('uuid');

class Pago {
  constructor({
    id,
    pedidoId,
    monto,
    metodo,
    fechaPago,
    createdAt,
    updatedAt
  }) {
    this.id = id || uuidv4();
    this.pedidoId = pedidoId;
    this.monto = Number(monto);
    this.metodo = metodo;
    this.fechaPago = fechaPago || new Date().toISOString();
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}

module.exports = { Pago };