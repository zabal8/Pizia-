const express = require('express');

const router = express.Router();

const pedidoController = require(
  '../controllers/pedido.controller'
);

router.get('/all', (req, res) => {
  pedidoController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  pedidoController.getById(req, res);
});

router.post('/', (req, res) => {
  pedidoController.create(req, res);
});

router.put('/:id', (req, res) => {
  pedidoController.update(req, res);
});

router.delete('/:id', (req, res) => {
  pedidoController.delete(req, res);
});

module.exports = router;