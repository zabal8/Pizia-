const express = require('express');

const router = express.Router();

const pizzaController = require(
  '../controllers/pizza.controller'
);

router.get('/all', (req, res) => {
  pizzaController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  pizzaController.getById(req, res);
});

router.post('/', (req, res) => {
  pizzaController.create(req, res);
});

router.put('/:id', (req, res) => {
  pizzaController.update(req, res);
});

router.delete('/:id', (req, res) => {
  pizzaController.delete(req, res);
});

module.exports = router;