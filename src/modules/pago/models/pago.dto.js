class PagoRequest {
  constructor(data) {
    this.pedidoId = data.pedidoId;
    this.monto = data.monto;
    this.metodo = data.metodo;
  }

  validate() {
    const errors = [];

    if (!this.pedidoId) {
      errors.push('El pedidoId es obligatorio');
    }

    if (
      this.monto === undefined ||
      this.monto === null ||
      isNaN(Number(this.monto))
    ) {
      errors.push('El monto es obligatorio y debe ser numérico');
    }

    if (!this.metodo || typeof this.metodo !== 'string') {
      errors.push('El método de pago es obligatorio');
    }

    return errors;
  }
}

class PagoResponse {
  constructor(pago) {
    this.id = pago.id;
    this.pedidoId = pago.pedidoId;
    this.monto = pago.monto;
    this.metodo = pago.metodo;
    this.fechaPago = pago.fechaPago;
    this.createdAt = pago.createdAt;
    this.updatedAt = pago.updatedAt;
  }
}

module.exports = {
  PagoRequest,
  PagoResponse
};