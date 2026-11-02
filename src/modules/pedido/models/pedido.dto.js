class PedidoRequest {
  constructor(data) {
    this.clienteId = data.clienteId;
    this.pizzaId = data.pizzaId;
  }

  validate() {
    const errors = [];

    if (!this.clienteId) {
      errors.push('El clienteId es obligatorio');
    }

    if (!this.pizzaId) {
      errors.push('El pizzaId es obligatorio');
    }

    return errors;
  }
}

class PedidoResponse {
  constructor(pedido) {
    this.id = pedido.id;
    this.clienteId = pedido.clienteId;
    this.pizzaId = pedido.pizzaId;
    this.fecha = pedido.fecha;
    this.createdAt = pedido.createdAt;
    this.updatedAt = pedido.updatedAt;
  }
}

module.exports = {
  PedidoRequest,
  PedidoResponse
};
