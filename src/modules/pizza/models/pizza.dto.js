class PizzaRequest {
  constructor(data) {
    this.nombre = data.nombre;
    this.precio = data.precio;
    this.ingredientes = data.ingredientes || [];
  }

  validate() {
    const errors = [];

    if (!this.nombre || typeof this.nombre !== 'string') {
      errors.push('El nombre es obligatorio');
    }

    if (
      this.precio === undefined ||
      this.precio === null ||
      isNaN(Number(this.precio))
    ) {
      errors.push('El precio es obligatorio y debe ser numérico');
    }

    if (!Array.isArray(this.ingredientes)) {
      errors.push('Los ingredientes deben ser un arreglo');
    }

    return errors;
  }
}

class PizzaResponse {
  constructor(pizza) {
    this.id = pizza.id;
    this.nombre = pizza.nombre;
    this.precio = pizza.precio;
    this.ingredientes = pizza.ingredientes;
    this.createdAt = pizza.createdAt;
    this.updatedAt = pizza.updatedAt;
  }
}

module.exports = {
  PizzaRequest,
  PizzaResponse
};