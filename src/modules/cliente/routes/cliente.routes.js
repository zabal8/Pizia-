const express = require('express');

const router = express.Router();

const clienteController = require('../controllers/cliente.controller');

router.get('/all', (req, res) => {
  clienteController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  clienteController.getById(req, res);
});

router.post('/', (req, res) => {
  clienteController.create(req, res);
});

router.put('/:id', (req, res) => {
  clienteController.update(req, res);
});

router.delete('/:id', (req, res) => {
  clienteController.delete(req, res);
});

module.exports = router;