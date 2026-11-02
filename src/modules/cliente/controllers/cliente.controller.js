const clienteService = require('../services/cliente.service');

const {
  ClienteRequest,
  ClienteResponse
} = require('../models/cliente.dto');

class ClienteController {

  getAll(req, res) {
    try {
      const clientes = clienteService.findAll();

      const response = clientes.map(
        cliente => new ClienteResponse(cliente)
      );

      return res.status(200).json(response);

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  getById(req, res) {
    try {
      const cliente = clienteService.findById(req.params.id);

      return res.status(200).json(
        new ClienteResponse(cliente)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  create(req, res) {
    try {
      const request = new ClienteRequest(req.body);

      const errors = request.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          message: 'Error de validación',
          errors
        });
      }

      const cliente = clienteService.save(
        request.toData()
      );

      return res.status(201).json(
        new ClienteResponse(cliente)
      );

    } catch (error) {

      if (error.code === 'DUPLICATE_EMAIL') {
        return res.status(409).json({
          message: error.message
        });
      }

      return res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  }

  update(req, res) {
    try {
      // Primero buscamos el cliente
      const clienteActual = clienteService.findById(
        req.params.id
      );

      // Combinamos los datos actuales con los nuevos
      const datosActualizados = {
        ...clienteActual,
        ...req.body
      };

      // Validamos el resultado final
      const request = new ClienteRequest(
        datosActualizados
      );

      const errors = request.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          message: 'Error de validación',
          errors
        });
      }

      const cliente = clienteService.update(
        req.params.id,
        request.toData()
      );

      return res.status(200).json(
        new ClienteResponse(cliente)
      );

    } catch (error) {

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          message: error.message
        });
      }

      if (error.code === 'DUPLICATE_EMAIL') {
        return res.status(409).json({
          message: error.message
        });
      }

      return res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  }

  delete(req, res) {
    try {
      clienteService.delete(req.params.id);

      return res.status(204).send();

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }
}

module.exports = new ClienteController();