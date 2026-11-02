const pizzaService = require('../services/pizza.service');

const {
  PizzaRequest,
  PizzaResponse
} = require('../models/pizza.dto');

class PizzaController {

  getAll(req, res) {
    try {
      const pizzas = pizzaService.findAll();

      return res.status(200).json(
        pizzas.map(pizza => new PizzaResponse(pizza))
      );

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  getById(req, res) {
    try {
      const pizza = pizzaService.findById(req.params.id);

      return res.status(200).json(
        new PizzaResponse(pizza)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  create(req, res) {
    try {
      const request = new PizzaRequest(req.body);

      const errors = request.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          errors
        });
      }

      const pizza = pizzaService.save(req.body);

      return res.status(201).json(
        new PizzaResponse(pizza)
      );

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  update(req, res) {
    try {
      const pizza = pizzaService.update(
        req.params.id,
        req.body
      );

      return res.status(200).json(
        new PizzaResponse(pizza)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  delete(req, res) {
    try {
      pizzaService.delete(req.params.id);

      return res.status(204).send();

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }
}

module.exports = new PizzaController();