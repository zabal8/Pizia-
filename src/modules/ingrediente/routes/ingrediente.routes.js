const express = require('express');

const router = express.Router();

const ingredienteController = require(
  '../controllers/ingrediente.controller'
);

router.get('/all', (req, res) => {
  ingredienteController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  ingredienteController.getById(req, res);
});

router.post('/', (req, res) => {
  ingredienteController.create(req, res);
});

router.put('/:id', (req, res) => {
  ingredienteController.update(req, res);
});

router.delete('/:id', (req, res) => {
  ingredienteController.delete(req, res);
});

module.exports = router;