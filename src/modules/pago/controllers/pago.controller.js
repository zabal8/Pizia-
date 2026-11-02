const pagoService = require('../services/pago.service');

const {
  PagoRequest,
  PagoResponse
} = require('../models/pago.dto');

class PagoController {

  getAll(req, res) {
    try {
      const pagos = pagoService.findAll();

      return res.status(200).json(
        pagos.map(
          pago => new PagoResponse(pago)
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
      const pago = pagoService.findById(
        req.params.id
      );

      return res.status(200).json(
        new PagoResponse(pago)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  create(req, res) {
    try {
      const request = new PagoRequest(req.body);

      const errors = request.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          errors
        });
      }

      const pago = pagoService.save(req.body);

      return res.status(201).json(
        new PagoResponse(pago)
      );

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  update(req, res) {
    try {
      const pago = pagoService.update(
        req.params.id,
        req.body
      );

      return res.status(200).json(
        new PagoResponse(pago)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  delete(req, res) {
    try {
      pagoService.delete(req.params.id);

      return res.status(204).send();

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }
}

module.exports = new PagoController();