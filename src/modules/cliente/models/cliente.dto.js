class ClienteRequest {
  constructor(data = {}) {
    this.nombre =
      typeof data.nombre === 'string'
        ? data.nombre.trim()
        : data.nombre;

    this.email =
      typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : data.email;
  }

  validate() {
    const errors = [];

    // Validación del nombre
    if (!this.nombre) {
      errors.push('El nombre es obligatorio');
    } else if (typeof this.nombre !== 'string') {
      errors.push('El nombre debe ser un texto');
    } else if (this.nombre.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (this.nombre.length > 100) {
      errors.push('El nombre no puede superar los 100 caracteres');
    }

    // Validación del email
    if (!this.email) {
      errors.push('El email es obligatorio');
    } else if (typeof this.email !== 'string') {
      errors.push('El email debe ser un texto');
    } else if (this.email.length > 254) {
      errors.push('El email no puede superar los 254 caracteres');
    } else {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(this.email)) {
        errors.push('El email no tiene un formato válido');
      }
    }

    return errors;
  }

  toData() {
    return {
      nombre: this.nombre,
      email: this.email
    };
  }
}

class ClienteResponse {
  constructor(cliente) {
    this.id = cliente.id;
    this.nombre = cliente.nombre;
    this.email = cliente.email;
    this.createdAt = cliente.createdAt;
    this.updatedAt = cliente.updatedAt;
  }
}

module.exports = {
  ClienteRequest,
  ClienteResponse
};