const ingredienteService = require('../services/ingrediente.service');

const {
  IngredienteRequest,
  IngredienteResponse
} = require('../models/ingrediente.dto');

class IngredienteController {

  getAll(req, res) {
    try {
      const ingredientes = ingredienteService.findAll();

      return res.status(200).json(
        ingredientes.map(
          ingrediente => new IngredienteResponse(ingrediente)
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
      const ingrediente = ingredienteService.findById(
        req.params.id
      );

      return res.status(200).json(
        new IngredienteResponse(ingrediente)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  create(req, res) {
    try {
      const request = new IngredienteRequest(req.body);

      const errors = request.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          errors
        });
      }

      const ingrediente = ingredienteService.save(req.body);

      return res.status(201).json(
        new IngredienteResponse(ingrediente)
      );

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  update(req, res) {
    try {
      const ingrediente = ingredienteService.update(
        req.params.id,
        req.body
      );

      return res.status(200).json(
        new IngredienteResponse(ingrediente)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  delete(req, res) {
    try {
      ingredienteService.delete(req.params.id);

      return res.status(204).send();

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }
}

module.exports = new IngredienteController();