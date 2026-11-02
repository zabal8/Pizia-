const express = require('express');

const router = express.Router();

const recomendacionIAController = require(
  '../controllers/recomendacionIA.controller'
);

router.get('/all', (req, res) => {
  recomendacionIAController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  recomendacionIAController.getById(req, res);
});

router.post('/', (req, res) => {
  recomendacionIAController.create(req, res);
});

router.put('/:id', (req, res) => {
  recomendacionIAController.update(req, res);
});

router.delete('/:id', (req, res) => {
  recomendacionIAController.delete(req, res);
});

module.exports = router;