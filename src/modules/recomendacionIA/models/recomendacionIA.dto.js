class RecomendacionIARequest {
  constructor(data) {
    this.clienteId = data.clienteId;
    this.pizzaRecomendadaId = data.pizzaRecomendadaId;
    this.motivo = data.motivo;
  }

  validate() {
    const errors = [];

    if (!this.clienteId) {
      errors.push('El clienteId es obligatorio');
    }

    if (!this.pizzaRecomendadaId) {
      errors.push('El pizzaRecomendadaId es obligatorio');
    }

    if (!this.motivo || typeof this.motivo !== 'string') {
      errors.push('El motivo es obligatorio');
    }

    return errors;
  }
}

class RecomendacionIAResponse {
  constructor(recomendacion) {
    this.id = recomendacion.id;
    this.clienteId = recomendacion.clienteId;
    this.pizzaRecomendadaId = recomendacion.pizzaRecomendadaId;
    this.motivo = recomendacion.motivo;
    this.fecha = recomendacion.fecha;
    this.createdAt = recomendacion.createdAt;
    this.updatedAt = recomendacion.updatedAt;
  }
}

module.exports = {
  RecomendacionIARequest,
  RecomendacionIAResponse
};