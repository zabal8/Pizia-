class IngredienteRequest {
  constructor(data) {
    this.nombre = data.nombre;
  }

  validate() {
    const errors = [];

    if (!this.nombre || typeof this.nombre !== 'string') {
      errors.push('El nombre es obligatorio');
    }

    return errors;
  }
}

class IngredienteResponse {
  constructor(ingrediente) {
    this.id = ingrediente.id;
    this.nombre = ingrediente.nombre;
    this.createdAt = ingrediente.createdAt;
    this.updatedAt = ingrediente.updatedAt;
  }
}

module.exports = {
  IngredienteRequest,
  IngredienteResponse
};