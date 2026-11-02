const pedidoService = require('../services/pedido.service');

const {
  PedidoRequest,
  PedidoResponse
} = require('../models/pedido.dto');

class PedidoController {

  getAll(req, res) {
    try {
      const pedidos = pedidoService.findAll();

      return res.status(200).json(
        pedidos.map(
          pedido => new PedidoResponse(pedido)
        )
      );

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  getById(req, res) {
    try {
      const pedido = pedidoService.findById(
        req.params.id
      );

      return res.status(200).json(
        new PedidoResponse(pedido)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  create(req, res) {
    try {
      const request = new PedidoRequest(req.body);

      const errors = request.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          errors
        });
      }

      const pedido = pedidoService.save(req.body);

      return res.status(201).json(
        new PedidoResponse(pedido)
      );

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  update(req, res) {
    try {
      const pedido = pedidoService.update(
        req.params.id,
        req.body
      );

      return res.status(200).json(
        new PedidoResponse(pedido)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  delete(req, res) {
    try {
      pedidoService.delete(req.params.id);

      return res.status(204).send();

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }
}

module.exports = new PedidoController();