const express = require('express');

const router = express.Router();

const pagoController = require(
  '../controllers/pago.controller'
);

router.get('/all', (req, res) => {
  pagoController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  pagoController.getById(req, res);
});

router.post('/', (req, res) => {
  pagoController.create(req, res);
});

router.put('/:id', (req, res) => {
  pagoController.update(req, res);
});

router.delete('/:id', (req, res) => {
  pagoController.delete(req, res);
});

module.exports = router;