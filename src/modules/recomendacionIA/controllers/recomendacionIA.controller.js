const recomendacionIAService = require(
  '../services/recomendacionIA.service'
);

const {
  RecomendacionIARequest,
  RecomendacionIAResponse
} = require('../models/recomendacionIA.dto');

class RecomendacionIAController {

  getAll(req, res) {
    try {
      const recomendaciones =
        recomendacionIAService.findAll();

      return res.status(200).json(
        recomendaciones.map(
          recomendacion =>
            new RecomendacionIAResponse(recomendacion)
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
      const recomendacion =
        recomendacionIAService.findById(req.params.id);

      return res.status(200).json(
        new RecomendacionIAResponse(recomendacion)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  create(req, res) {
    try {
      const request =
        new RecomendacionIARequest(req.body);

      const errors = request.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          errors
        });
      }

      const recomendacion =
        recomendacionIAService.save(req.body);

      return res.status(201).json(
        new RecomendacionIAResponse(recomendacion)
      );

    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  update(req, res) {
    try {
      const recomendacion =
        recomendacionIAService.update(
          req.params.id,
          req.body
        );

      return res.status(200).json(
        new RecomendacionIAResponse(recomendacion)
      );

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }

  delete(req, res) {
    try {
      recomendacionIAService.delete(req.params.id);

      return res.status(204).send();

    } catch (error) {
      return res.status(404).json({
        message: error.message
      });
    }
  }
}

module.exports = new RecomendacionIAController();